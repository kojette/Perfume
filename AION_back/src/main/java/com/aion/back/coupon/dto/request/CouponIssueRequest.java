package com.aion.back.coupon.dto.request;

import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class CouponIssueRequest {
    private String code;
    private String name;
    private String discountType;
    private Integer discountValue;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
}