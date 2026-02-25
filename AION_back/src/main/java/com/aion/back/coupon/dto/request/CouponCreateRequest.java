package com.aion.back.coupon.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class CouponCreateRequest {
    private String code;
    private String discountType;
    private Integer discountValue;
    private Integer minPurchase;
    private Integer maxDiscount;
    private LocalDateTime expiryDate;
    private Integer usageLimit;
    private Boolean isStackable;
}