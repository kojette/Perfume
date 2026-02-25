package com.aion.back.coupon.service;

import com.aion.back.coupon.dto.request.CouponCreateRequest;
import com.aion.back.coupon.dto.response.UserCouponResponse;
import com.aion.back.coupon.entity.Coupon;
import com.aion.back.coupon.entity.UserCoupon;
import com.aion.back.coupon.repository.CouponRepository;
import com.aion.back.coupon.repository.UserCouponRepository;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final MemberService memberService;
    private final UserCouponRepository userCouponRepository;
    private final CouponRepository couponRepository;

    public List<UserCouponResponse> getMyCoupons(String token) {

        Member member = memberService.getMemberEntityByToken(token);

        List<UserCoupon> userCoupons = userCouponRepository.findByMember(member);

        return userCoupons.stream()
                .map(UserCouponResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public Coupon createCoupon(CouponCreateRequest dto) {

        if (couponRepository.findByCode(dto.getCode()).isPresent()) {
            throw new RuntimeException("이미 존재하는 쿠폰 코드입니다.");
        }

        Coupon newCoupon = Coupon.builder()
                .code(dto.getCode())
                .discountType(dto.getDiscountType())
                .discountValue(dto.getDiscountValue())
                .minPurchase(dto.getMinPurchase() != null ? dto.getMinPurchase() : 0)
                .maxDiscount(dto.getMaxDiscount())
                .expiryDate(dto.getExpiryDate())
                .usageLimit(dto.getUsageLimit() != null ? dto.getUsageLimit() : 1)
                .isStackable(dto.getIsStackable() != null ? dto.getIsStackable() : false)
                .createdAt(LocalDateTime.now())
                .build();

        return couponRepository.save(newCoupon);
    }
}