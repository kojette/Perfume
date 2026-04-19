package com.aion.back.order.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class OrderCheckoutRequestDto {
    private List<Long> cartItemIds;   // 선택 구매: null이면 전체 구매 (하위 호환)
    private Long userCouponId;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String shippingZipcode;
    private int pointsToUse;
}
