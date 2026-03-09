package com.aion.back.order.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.order.dto.request.OrderCheckoutRequestDto;
import com.aion.back.order.dto.response.OrderResponseDto;
import com.aion.back.order.entity.Order;
import com.aion.back.order.repository.OrderRepository;
import com.aion.back.order.service.OrderService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;
    private final MemberService memberService;
    private final OrderRepository orderRepository;

    @PostMapping("/checkout")
    public ApiResponse<OrderResponseDto> checkout(
                                                   @RequestHeader("Authorization") String token,
                                                   @RequestBody com.aion.back.order.dto.request.OrderCheckoutRequestDto requestDto // 👈 프론트에서 보낸 데이터를 드디어 받습니다!!
    ) {
        OrderResponseDto response = orderService.checkout(token, requestDto);

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
            @PathVariable Long orderId) {

        Member member = memberService.getMemberEntityByToken(token);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("주문을 찾을 수 없습니다."));

        if (!order.getMember().getUserId().equals(member.getUserId())) {
            throw new RuntimeException("본인의 주문만 조회할 수 있습니다.");
        }

        // 적립 포인트 계산 (0.1%)
        int pointsEarned = (int) Math.floor(
                (order.getFinalAmount() == null ? 0 : order.getFinalAmount()) * 0.001
        );

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", order.getOrderId());
        response.put("orderNumber", order.getOrderNumber());
        response.put("orderStatus", order.getOrderStatus());
        response.put("paymentMethod", order.getPaymentMethod());
        response.put("totalAmount", order.getTotalAmount());                                              // 원가
        response.put("discountAmount", order.getDiscountAmount() == null ? 0 : order.getDiscountAmount()); // 쿠폰 할인
        response.put("pointsUsed", order.getPointsUsed() == null ? 0 : order.getPointsUsed());           // 포인트 차감
        response.put("finalAmount", order.getFinalAmount());                                              // 최종 금액
        response.put("pointsEarned", pointsEarned);                                                      // 적립 포인트
        response.put("receiverName", order.getReceiverName());
        response.put("receiverPhone", order.getReceiverPhone());
        response.put("shippingZipcode", order.getShippingZipcode());
        response.put("shippingAddress", order.getShippingAddress());
        response.put("createdAt", order.getCreatedAt());

        List<Map<String, Object>> items = order.getOrderItems().stream()
                .map(item -> {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("orderItemId", item.getOrderItemId());
                    itemMap.put("perfumeId", item.getPerfume() != null ? item.getPerfume().getPerfumeId() : null);
                    itemMap.put("isCustom", item.getIsCustom() != null && item.getIsCustom());
                    itemMap.put("imageUrl", item.getImageUrl());
                    itemMap.put("perfumeNameSnapshot", item.getPerfumeNameSnapshot());
                    itemMap.put("volumeMl", item.getVolumeMl());
                    itemMap.put("quantity", item.getQuantity());
                    itemMap.put("unitPrice", item.getUnitPrice());
                    itemMap.put("finalPrice", item.getFinalPrice());
                    return itemMap;
                })
                .collect(Collectors.toList());

        response.put("orderItems", items);
        return ApiResponse.success("주문 상세 조회 성공", response);
    }
}