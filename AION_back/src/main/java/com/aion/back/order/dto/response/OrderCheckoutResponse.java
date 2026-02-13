package com.aion.back.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCheckoutResponse {
    private Long orderId;
    private String orderNumber;
    private Integer totalAmount;
    private Integer finalAmount;
}
