package com.aion.back.order.controller;

import com.aion.back.cart.entity.Cart;
import com.aion.back.cart.repository.CartRepository;
import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.order.dto.response.OrderCheckoutResponse;
import com.aion.back.order.entity.Order;
import com.aion.back.order.entity.OrderItem;
import com.aion.back.order.respository.OrderItemRepository;
import com.aion.back.order.respository.OrderRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

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
    public ApiResponse<OrderCheckoutResponse> checkout(@RequestHeader("Authorization") String token) {
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

        OrderCheckoutResponse response = OrderCheckoutResponse.builder()
                .orderId(savedOrder.getOrderId())
                .orderNumber(savedOrder.getOrderNumber())
                .totalAmount(savedOrder.getTotalAmount())
                .finalAmount(savedOrder.getFinalAmount())
                .build();

        return ApiResponse.success("주문이 성공적으로 완료되었습니다!", response);
    }

    @GetMapping("/my")
    public ApiResponse<List<Order>> getMyOrders(@RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        List<Order> myOrders = orderRepository.findByMemberOrderByCreatedAtDesc(member);

        return ApiResponse.success("주문 내역 조회 성공", myOrders);
    }

    @GetMapping("/{orderId}")
    @Transactional
    public ApiResponse<Map<String, Object>> getOrderDetail(
            @RequestHeader("Authorization") String token,
            @PathVariable Long orderId
    ) {
        try {
            System.out.println("=== 주문 상세 조회 시작 ===");
            System.out.println("orderId: " + orderId);
            System.out.println("token: " + token);

            Member member = memberService.getMemberEntityByToken(token);
            System.out.println("Member 조회 성공: " + member.getEmail());

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));
            System.out.println("Order 조회 성공: " + order.getOrderId());

            if (!order.getMember().getUserId().equals(member.getUserId())) {
                throw new RuntimeException("본인의 주문만 조회할 수 있습니다.");
            }
            System.out.println("권한 확인 성공");

            // Map으로 직접 변환
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.getOrderId());
            response.put("orderNumber", order.getOrderNumber());
            response.put("orderStatus", order.getOrderStatus());
            response.put("paymentMethod", order.getPaymentMethod());
            response.put("totalAmount", order.getTotalAmount());
            response.put("finalAmount", order.getFinalAmount());
            response.put("receiverName", order.getReceiverName());
            response.put("receiverPhone", order.getReceiverPhone());
            response.put("shippingZipcode", order.getShippingZipcode());
            response.put("shippingAddress", order.getShippingAddress());
            response.put("createdAt", order.getCreatedAt());

            System.out.println("OrderItems 개수: " + order.getOrderItems().size());

            // OrderItems 변환
            List<Map<String, Object>> items = order.getOrderItems().stream()
                    .map(item -> {
                        Map<String, Object> itemMap = new HashMap<>();
                        itemMap.put("orderItemId", item.getOrderItemId());
                        itemMap.put("perfumeId", item.getPerfume().getPerfumeId());
                        itemMap.put("perfumeNameSnapshot", item.getPerfumeNameSnapshot());
                        itemMap.put("volumeMl", item.getVolumeMl());
                        itemMap.put("quantity", item.getQuantity());
                        itemMap.put("unitPrice", item.getUnitPrice());
                        itemMap.put("finalPrice", item.getFinalPrice());
                        return itemMap;
                    })
                    .collect(Collectors.toList());

            response.put("orderItems", items);

            System.out.println("응답 데이터 생성 완료");
            return ApiResponse.success("주문 상세 조회 성공", response);

        } catch (Exception e) {
            System.err.println("=== 에러 발생 ===");
            System.err.println("에러 메시지: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
