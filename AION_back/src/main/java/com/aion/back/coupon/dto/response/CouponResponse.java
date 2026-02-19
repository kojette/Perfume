package com.aion.back.coupon.dto.response;

import com.aion.back.coupon.entity.Coupon;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class CouponResponse {
    private Long id;
    private String code;
    private String discountType;
    private Integer discountValue;
    private LocalDateTime expiryDate;

    public static CouponResponse from(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .expiryDate(coupon.getExpiryDate())
                .build();
    }
}