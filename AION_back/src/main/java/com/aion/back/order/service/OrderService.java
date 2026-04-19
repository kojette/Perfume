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
import com.aion.back.point.entity.Point;
import com.aion.back.point.repository.PointHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
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
    private final MemberRepository memberRepository;
    private final PointHistoryRepository pointHistoryRepository;

    @Transactional
    public OrderResponseDto checkout(String token, OrderCheckoutRequestDto requestDto) {

        Member member = memberService.getMemberEntityByToken(token);

        // ── 1. 카트 조회 ─────────────────────────────────────────────────────
        List<Cart> allCartItems = cartRepository.findByMember(member);
        if (allCartItems.isEmpty()) {
            throw new RuntimeException("장바구니가 비어있어 주문을 진행할 수 없습니다.");
        }

        // cartItemIds가 있으면 선택 구매, 없으면 전체 구매 (하위 호환)
        final List<Cart> cartItems;
        if (requestDto.getCartItemIds() != null && !requestDto.getCartItemIds().isEmpty()) {
            Set<Long> selectedIds = Set.copyOf(requestDto.getCartItemIds());
            cartItems = allCartItems.stream()
                    .filter(c -> selectedIds.contains(c.getCartId()))
                    .collect(Collectors.toList());

            if (cartItems.isEmpty()) {
                throw new RuntimeException("선택하신 상품을 장바구니에서 찾을 수 없습니다.");
            }
            // 본인 소유 검증 (findByMember로 이미 필터됐지만 명시적 확인)
            boolean allOwned = cartItems.stream()
                    .allMatch(c -> c.getMember().getUserId().equals(member.getUserId()));
            if (!allOwned) {
                throw new RuntimeException("권한이 없는 장바구니 항목이 포함되어 있습니다.");
            }
        } else {
            cartItems = allCartItems;
        }

        // ── 2. 금액 계산 ──────────────────────────────────────────────────────
        int totalAmount = cartItems.stream()
                .mapToInt(item -> {
                    if (Boolean.TRUE.equals(item.getIsCustom())) {
                        return (item.getCustomPrice() != null ? item.getCustomPrice() : 0) * item.getQuantity();
                    } else {
                        if (item.getPerfume() == null) return 0;
                        int price = item.getPerfume().getSalePrice() != null
                                ? item.getPerfume().getSalePrice()
                                : item.getPerfume().getPrice();
                        return price * item.getQuantity();
                    }
                })
                .sum();

        // ── 3. 쿠폰 처리 ─────────────────────────────────────────────────────
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

        // ── 4. 포인트 차감 ────────────────────────────────────────────────────
        int pointsToUse = requestDto.getPointsToUse();
        if (pointsToUse < 0) {
            throw new RuntimeException("포인트 사용량이 유효하지 않습니다.");
        }
        if (pointsToUse > 0) {
            int currentPoints = member.getTotalPoints() == null ? 0 : member.getTotalPoints();
            if (currentPoints < pointsToUse) {
                throw new RuntimeException("보유 포인트가 부족합니다. (보유: " + currentPoints + "P, 요청: " + pointsToUse + "P)");
            }
            int maxUsable = Math.max(0, totalAmount - discountAmount);
            if (pointsToUse > maxUsable) {
                throw new RuntimeException("포인트 사용액이 결제 금액을 초과할 수 없습니다.");
            }
        }

        int finalAmount = Math.max(0, totalAmount - discountAmount - pointsToUse);

        // ── 5. 배송지 처리 ────────────────────────────────────────────────────
        String receiverName     = notBlank(requestDto.getReceiverName())     ? requestDto.getReceiverName()     : member.getName();
        String receiverPhone    = notBlank(requestDto.getReceiverPhone())    ? requestDto.getReceiverPhone()    : member.getPhone();
        String shippingZipcode  = notBlank(requestDto.getShippingZipcode())  ? requestDto.getShippingZipcode()  : orEmpty(member.getZipcode());
        String shippingAddress  = notBlank(requestDto.getShippingAddress())  ? requestDto.getShippingAddress()  : orEmpty(member.getAddress());

        // ── 6. 주문 저장 ──────────────────────────────────────────────────────
        Order order = Order.builder()
                .member(member)
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .pointsUsed(pointsToUse)
                .finalAmount(finalAmount)
                .orderStatus("PAID")
                .paymentMethod("CARD")
                .receiverName(receiverName)
                .receiverPhone(receiverPhone)
                .shippingZipcode(shippingZipcode)
                .shippingAddress(shippingAddress)
                .build();

        Order savedOrder = orderRepository.save(order);

        // ── 7. 포인트 차감 이력 ───────────────────────────────────────────────
        if (pointsToUse > 0) {
            int balanceAfterUse = (member.getTotalPoints() == null ? 0 : member.getTotalPoints()) - pointsToUse;

            pointHistoryRepository.save(Point.builder()
                    .member(member)
                    .amount(-pointsToUse)
                    .balanceAfter(balanceAfterUse)
                    .reason("포인트 사용")
                    .reasonDetail("주문 결제 포인트 차감 (" + savedOrder.getOrderNumber() + ")")
                    .relatedOrderId(savedOrder.getOrderId())
                    .status(Point.PointStatus.USED)
                    .usedAt(LocalDateTime.now())
                    .build());

            member.setTotalPoints(balanceAfterUse);
            memberRepository.save(member);
        }

        // ── 8. 주문 아이템 저장 ───────────────────────────────────────────────
        List<OrderItem> orderItems = cartItems.stream()
                .filter(cart -> Boolean.TRUE.equals(cart.getIsCustom()) || cart.getPerfume() != null)
                .map(cart -> {
                    if (Boolean.TRUE.equals(cart.getIsCustom())) {
                        int price = cart.getCustomPrice() != null ? cart.getCustomPrice() : 0;
                        return OrderItem.builder()
                                .order(savedOrder)
                                .isCustom(true)
                                .perfume(null)
                                .perfumeNameSnapshot(cart.getCustomName())
                                .imageUrl(cart.getCustomImageUrl())
                                .volumeMl(0)
                                .quantity(cart.getQuantity())
                                .unitPrice(price)
                                .finalPrice(price * cart.getQuantity())
                                .build();
                    } else {
                        int price = cart.getPerfume().getSalePrice() != null
                                ? cart.getPerfume().getSalePrice()
                                : cart.getPerfume().getPrice();
                        return OrderItem.builder()
                                .order(savedOrder)
                                .isCustom(false)
                                .perfume(cart.getPerfume())
                                .perfumeNameSnapshot(cart.getPerfume().getName())
                                .volumeMl(cart.getPerfume().getVolumeMl() != null ? cart.getPerfume().getVolumeMl() : 50)
                                .quantity(cart.getQuantity())
                                .unitPrice(price)
                                .finalPrice(price * cart.getQuantity())
                                .build();
                    }
                })
                .collect(Collectors.toList());

        orderItemRepository.saveAll(orderItems);

        // ── 9. 주문된 항목만 카트에서 삭제 (선택 구매 핵심) ──────────────────
        cartRepository.deleteAll(cartItems);  // 전체가 아닌 선택된 cartItems만 삭제

        // ── 10. 포인트 적립 ───────────────────────────────────────────────────
        int earnedPoints = (int) Math.floor(finalAmount * 0.001);
        if (earnedPoints > 0) {
            int currentBalance = member.getTotalPoints() == null ? 0 : member.getTotalPoints();
            int balanceAfterEarn = currentBalance + earnedPoints;

            pointHistoryRepository.save(Point.builder()
                    .member(member)
                    .amount(earnedPoints)
                    .balanceAfter(balanceAfterEarn)
                    .reason("주문 포인트 적립")
                    .reasonDetail("결제 금액 ₩" + String.format("%,d", finalAmount)
                            + "의 0.1% 적립 (" + savedOrder.getOrderNumber() + ")")
                    .relatedOrderId(savedOrder.getOrderId())
                    .status(Point.PointStatus.AVAILABLE)
                    .expireAt(LocalDateTime.now().plusYears(1))
                    .build());

            member.setTotalPoints(balanceAfterEarn);
            memberRepository.save(member);
        }

        return OrderResponseDto.from(savedOrder);
    }

    // ── 유틸 ──────────────────────────────────────────────────────────────────
    private boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private String orEmpty(String s) {
        return s != null ? s : "";
    }
}
