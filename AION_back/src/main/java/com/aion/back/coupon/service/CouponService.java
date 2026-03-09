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
import java.util.Objects;
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
                .filter(Objects::nonNull)
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

    @Transactional
    public void registerCoupon(String token, String couponCode) {
        Member member = memberService.getMemberEntityByToken(token);

        Coupon coupon = couponRepository.findByCode(couponCode)
                .orElseThrow(() -> new RuntimeException("유효하지 않은 쿠폰 코드입니다."));

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("만료된 쿠폰입니다.");
        }

        List<UserCoupon> existingCoupons = userCouponRepository.findByMember(member);
        boolean alreadyRegistered = existingCoupons.stream()
                .filter(uc -> uc.getCoupon() != null)
                .anyMatch(uc -> uc.getCoupon().getId().equals(coupon.getId()));

        if (alreadyRegistered) {
            throw new RuntimeException("이미 등록된 쿠폰입니다.");
        }

        UserCoupon userCoupon = UserCoupon.builder()
                .member(member)
                .coupon(coupon)
                .isUsed(false)
                .build();

        userCouponRepository.save(userCoupon);
    }
}