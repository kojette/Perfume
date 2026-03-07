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

    @Transactional
    public void registerCoupon(String token, String couponCode) {
        // 1. 토큰으로 멤버 조회
        Member member = memberService.getMemberEntityByToken(token);

        // 2. 마스터 쿠폰 테이블에서 코드로 쿠폰 조회 (CouponRepository의 findByCode 활용)
        Coupon coupon = couponRepository.findByCode(couponCode)
                .orElseThrow(() -> new RuntimeException("유효하지 않은 쿠폰 코드입니다."));

        // 3. (선택사항) 만료일 체크 로직 추가 가능
        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("만료된 쿠폰입니다.");
        }

        // 4. 이미 등록했는지 중복 체크 (UserCouponRepository에 existsByMemberAndCoupon 추가 권장)
        List<UserCoupon> existingCoupons = userCouponRepository.findByMember(member);
        boolean alreadyRegistered = existingCoupons.stream()
                .anyMatch(uc -> uc.getCoupon().getId().equals(coupon.getId()));

        if (alreadyRegistered) {
            throw new RuntimeException("이미 등록된 쿠폰입니다.");
        }

        // 5. UserCoupon 생성 및 저장
        UserCoupon userCoupon = UserCoupon.builder()
                .member(member)
                .coupon(coupon)
                .isUsed(false)
                .build();

        userCouponRepository.save(userCoupon);
    }
}