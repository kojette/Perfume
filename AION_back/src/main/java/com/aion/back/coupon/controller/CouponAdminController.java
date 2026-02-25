package com.aion.back.coupon.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.coupon.dto.request.CouponCreateRequest;
import com.aion.back.coupon.entity.Coupon;
import com.aion.back.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CouponAdminController {

    private final CouponService couponService;

    // 관리자가 새 쿠폰 종류 생성
    @PostMapping
    public ApiResponse<Coupon> createCoupon(@RequestBody CouponCreateRequest request) {
        Coupon savedCoupon = couponService.createCoupon(request);
        return ApiResponse.success("쿠폰이 생성되었습니다.", savedCoupon);
    }
}