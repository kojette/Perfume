package com.aion.back.order.service;

import com.aion.back.cart.entity.Cart;
import com.aion.back.cart.repository.CartRepository;
import com.aion.back.coupon.entity.UserCoupon;
import com.aion.back.coupon.repository.UserCouponRepository;
import com.aion.back.member.entity.Member;
import com.aion.back.member.repository.MemberRepository;
import com.aion.back.member.service.MemberService;
import com.aion.back.order.dto.request.OrderCheckoutRequestDto;
import com.aion.back.order.dto.response.OrderResponseDto;
import com.aion.back.order.entity.Order;
import com.aion.back.order.entity.OrderItem;
import com.aion.back.order.repository.OrderItemRepository;
import com.aion.back.order.repository.OrderRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final MemberService memberService;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserCouponRepository userCouponRepository;
    private final EntityManager entityManager;
    private final MemberRepository memberRepository;

    @Transactional
    public OrderResponseDto checkout(String token, OrderCheckoutRequestDto requestDto) {
        Member member = memberService.getMemberEntityByToken(token);

        List<Cart> cartItems = cartRepository.findByMember(member);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("장바구니가 비어있어 주문을 진행할 수 없습니다.");
        }

        int totalAmount = cartItems.stream()
                .mapToInt(item -> item.getPerfume().getPrice() * item.getQuantity())
                .sum();

        int discountAmount = 0;

        if (requestDto.getUserCouponId() != null) {
            UserCoupon userCoupon = userCouponRepository.findById(requestDto.getUserCouponId())
                    .orElseThrow(() -> new RuntimeException("쿠폰 정보를 찾을 수 없습니다."));

            if (!userCoupon.getMember().getEmail().equals(member.getEmail()) || userCoupon.getIsUsed()) {
                throw new RuntimeException("사용할 수 없는 쿠폰입니다.");
            }

            if ("PERCENTAGE".equals(userCoupon.getCoupon().getDiscountType())) {
                discountAmount = (int) (totalAmount * (userCoupon.getCoupon().getDiscountValue() / 100.0));
            } else {
                discountAmount = userCoupon.getCoupon().getDiscountValue();
            }

            userCoupon.setIsUsed(true);
            userCoupon.setUsedAt(LocalDateTime.now());
            userCouponRepository.save(userCoupon);
        }

        int finalAmount = Math.max(0, totalAmount - discountAmount);

        Order order = Order.builder()
                .member(member)
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .totalAmount(totalAmount)
                .finalAmount(finalAmount)
                .orderStatus("COMPLETED")
                .createdAt(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(order);

        int earnedPoints = (int) Math.floor(finalAmount * 0.01);

        if (earnedPoints > 0) {
            member.setTotalPoints((member.getTotalPoints() == null ? 0 : member.getTotalPoints()) + earnedPoints);
            memberRepository.save(member);

            try {
                String insertSql = "INSERT INTO \"UserPoints\" (user_email, points, description, action_type, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
                int inserted = entityManager.createNativeQuery(insertSql)
                        .setParameter(1, member.getEmail())
                        .setParameter(2, earnedPoints)
                        .setParameter(3, "상품 구매 적립 (" + savedOrder.getOrderNumber() + ")")
                        .setParameter(4, "EARN")
                        .executeUpdate();
            } catch (Exception e) {
                System.err.println("UserPoints 내역 추가 실패: " + e.getMessage());
            }
        } else {
            System.out.println("적립할 포인트 0 -> 적립 쿼리 스킵");
        }

        List<OrderItem> orderItems = cartItems.stream().map(cart ->
                OrderItem.builder()
                        .order(savedOrder)
                        .perfume(cart.getPerfume())
                        .perfumeNameSnapshot(cart.getPerfume().getName())
                        .quantity(cart.getQuantity())
                        .unitPrice(cart.getPerfume().getPrice())
                        .finalPrice(cart.getPerfume().getPrice() * cart.getQuantity())
                        .build()
        ).collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);
        cartRepository.deleteAll(cartItems);

        return OrderResponseDto.from(savedOrder);
    }
}