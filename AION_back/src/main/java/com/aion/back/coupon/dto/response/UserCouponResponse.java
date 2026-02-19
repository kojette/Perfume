package com.aion.back.coupon.dto.response;

import com.aion.back.coupon.entity.UserCoupon;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class UserCouponResponse {
    private Long userCouponId;
    private String couponCode;
    private String discountType;
    private Integer discountValue;
    private Boolean isUsed;
    private LocalDateTime expiryDate;

    public static UserCouponResponse from(UserCoupon userCoupon) {
        return UserCouponResponse.builder()
                .userCouponId(userCoupon.getId())
                .couponCode(userCoupon.getCoupon().getCode()) // name -> code
                .discountType(userCoupon.getCoupon().getDiscountType())
                .discountValue(userCoupon.getCoupon().getDiscountValue())
                .isUsed(userCoupon.getIsUsed())
                .expiryDate(userCoupon.getCoupon().getExpiryDate())
                .build();
    }
}