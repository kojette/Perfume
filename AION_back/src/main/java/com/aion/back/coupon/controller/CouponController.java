package com.aion.back.coupon.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.coupon.dto.response.UserCouponResponse;
import com.aion.back.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/my")
    public ApiResponse<List<UserCouponResponse>> getMyCoupons(@RequestHeader("Authorization") String token) {

        List<UserCouponResponse> myCoupons = couponService.getMyCoupons(token);

        return ApiResponse.success("내 쿠폰 목록 조회 성공", myCoupons);
    }
}