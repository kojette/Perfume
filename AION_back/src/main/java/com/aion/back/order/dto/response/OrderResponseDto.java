package com.aion.back.order.dto.response;

import com.aion.back.order.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponseDto {

    private Long orderId;
    private String orderNumber;
    private String orderStatus;

    private Integer totalAmount;     // 원래 금액 (할인 전)
    private Integer discountAmount;  // 쿠폰 할인 금액
    private Integer pointsUsed;      // 사용된 포인트
    private Integer finalAmount;     // 최종 결제 금액
    private Integer pointsEarned;    // 이번 주문 적립 포인트 (0.1%)

    public static OrderResponseDto from(Order order) {
        int earned = (int) Math.floor(
                (order.getFinalAmount() == null ? 0 : order.getFinalAmount()) * 0.001
        );

        return OrderResponseDto.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .orderStatus(order.getOrderStatus())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount() == null ? 0 : order.getDiscountAmount())
                .pointsUsed(order.getPointsUsed() == null ? 0 : order.getPointsUsed())
                .finalAmount(order.getFinalAmount())
                .pointsEarned(earned)
                .build();
    }
}