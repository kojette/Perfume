package com.aion.back.order.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class OrderCheckoutRequestDto {
    private Long userCouponId;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String shippingZipcode;
}