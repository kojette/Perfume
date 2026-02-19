package com.aion.back.event.service;

import com.aion.back.event.dto.EventParticipationResponseDto;
import com.aion.back.event.entity.Event;
import com.aion.back.event.entity.EventParticipation;
import com.aion.back.event.repository.EventParticipationRepository;
import com.aion.back.event.repository.EventRepository;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.coupon.entity.Coupon;
import com.aion.back.coupon.entity.UserCoupon;
import com.aion.back.coupon.repository.CouponRepository;
import com.aion.back.coupon.repository.UserCouponRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventService {

    private final MemberService memberService;
    private final EventRepository eventRepository;
    private final EventParticipationRepository participationRepository;

    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;

    @Transactional
    public EventParticipationResponseDto participate(String token, Long eventId) {

        Member member = memberService.getMemberEntityByToken(token);

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("이벤트를 찾을 수 없습니다."));

        if (participationRepository.existsByMemberAndEvent(member, event)) {
            throw new RuntimeException("이미 참여한 이벤트입니다.");
        }

        double randomValue = Math.random() * 100;
        boolean isWon = randomValue < event.getWinProbability();

        EventParticipation participation = EventParticipation.builder()
                .member(member)
                .event(event)
                .won(isWon)
                .participatedAt(LocalDateTime.now())
                .build();
        participationRepository.save(participation);

        // 당첨 시 실제 쿠폰 발급 로직
        if (isWon) {
            if ("COUPON".equals(event.getEventType()) && event.getCouponCode() != null) {

                Coupon coupon = couponRepository.findByCode(event.getCouponCode())
                        .orElseThrow(() -> new RuntimeException("해당 이벤트 쿠폰 코드가 존재하지 않습니다: " + event.getCouponCode()));

                UserCoupon userCoupon = UserCoupon.builder()
                        .member(member)
                        .coupon(coupon)
                        .isUsed(false)
                        .build();

                userCouponRepository.save(userCoupon);

            } else if ("POINT".equals(event.getEventType()) && event.getPointAmount() != null) {
                // 포인트 지급 로직
            }
        }

        return EventParticipationResponseDto.builder()
                .won(isWon)
                .build();
    }
}