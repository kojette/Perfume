package com.aion.back.coupon.repository;

import com.aion.back.coupon.entity.UserCoupon;
import com.aion.back.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {

    List<UserCoupon> findByMember(Member member);
}