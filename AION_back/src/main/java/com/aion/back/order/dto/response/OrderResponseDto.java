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
    private Integer totalAmount;
    private Integer discountAmount;
    private Integer pointsUsed;
    private Integer finalAmount;
    private Integer pointsEarned;

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