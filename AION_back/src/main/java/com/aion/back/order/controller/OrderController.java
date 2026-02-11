package com.aion.back.order.controller;

import com.aion.back.cart.entity.Cart;
import com.aion.back.cart.repository.CartRepository;
import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.order.entity.Order;
import com.aion.back.order.entity.OrderItem;
import com.aion.back.order.respository.OrderItemRepository;
import com.aion.back.order.respository.OrderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final MemberService memberService;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @PostMapping("/checkout")
    @Transactional
    public ApiResponse<String> checkout(@RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        List<Cart> myCarts = cartRepository.findByMember(member);

        if (myCarts.isEmpty()) {
            throw new RuntimeException("장바구니가 비어있어 주문할 수 없습니다.");
        }

        int totalAmount = 0;
        for (Cart cart: myCarts) {
            totalAmount += (cart.getPerfume().getPrice() * cart.getQuantity());
        }

        Order newOrder = Order.builder()
                .member(member)
                .orderNumber("AION-" + UUID.randomUUID().toString().substring(0,8).toUpperCase())
                .paymentMethod("CARD") // 결제 수단 일단 카드로 설정
                .totalAmount(totalAmount)
                .finalAmount(totalAmount)
                .receiverName(member.getName())
                .receiverPhone(member.getPhone() != null ? member.getPhone() : "010-0000-0000")
                .shippingZipcode("12345")
                .shippingAddress("임시 배송지 주소")
                .build();

        Order savedOrder = orderRepository.save(newOrder);

        for (Cart cart: myCarts) {
            OrderItem item = OrderItem.builder()
                    .order(savedOrder)
                    .perfume(cart.getPerfume())
                    .perfumeNameSnapshot(cart.getPerfume().getName())
                    .volumeMl(50)
                    .quantity(cart.getQuantity())
                    .unitPrice(cart.getPerfume().getPrice())
                    .finalPrice(cart.getPerfume().getPrice() * cart.getQuantity())
                    .build();

            orderItemRepository.save(item);
        }

        cartRepository.deleteAll(myCarts);

        return ApiResponse.success("주문이 성공적으로 완료되었습니다!");
    }
}
