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
    private Integer totalAmount;
    private Integer finalAmount;
    private String orderStatus;

    public static OrderResponseDto from(Order order) {
        return OrderResponseDto.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .totalAmount(order.getTotalAmount())
                .finalAmount(order.getFinalAmount())
                .orderStatus(order.getOrderStatus())
                .build();
    }
}