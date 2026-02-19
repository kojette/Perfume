package com.aion.back.coupon.service;

import com.aion.back.coupon.dto.response.UserCouponResponse;
import com.aion.back.coupon.entity.UserCoupon;
import com.aion.back.coupon.repository.UserCouponRepository;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final MemberService memberService;
    private final UserCouponRepository userCouponRepository;

    public List<UserCouponResponse> getMyCoupons(String token) {

        Member member = memberService.getMemberEntityByToken(token);

        List<UserCoupon> userCoupons = userCouponRepository.findByMember(member);

        return userCoupons.stream()
                .map(UserCouponResponse::from)
                .collect(Collectors.toList());
    }
}