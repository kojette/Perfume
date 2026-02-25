package com.aion.back.event.service;

import com.aion.back.event.dto.response.EventParticipationResponseDto;
import com.aion.back.event.dto.request.EventRequestDto;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final MemberService memberService;
    private final EventRepository eventRepository;
    private final EventParticipationRepository participationRepository;
    private final CouponRepository couponRepository;
    private final UserCouponRepository userCouponRepository;

    // 1. 일반 유저용 기능
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

        // 당첨 시 쿠폰 발급
        if (isWon && "COUPON".equals(event.getEventType()) && event.getCouponCode() != null) {
            Coupon coupon = couponRepository.findByCode(event.getCouponCode())
                    .orElseThrow(() -> new RuntimeException("해당 쿠폰 코드가 존재하지 않습니다."));

            UserCoupon userCoupon = UserCoupon.builder()
                    .member(member)
                    .coupon(coupon)
                    .isUsed(false)
                    .build();
            userCouponRepository.save(userCoupon);
        }
        return EventParticipationResponseDto.builder().won(isWon).build();
    }

    // 내 참여 내역 가져오기
    public List<Map<String, Object>> getMyParticipations(String token) {
        Member member = memberService.getMemberEntityByToken(token);
        return participationRepository.findAllByMember(member).stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("eventId", p.getEvent().getId());
                    map.put("won", p.isWon());
                    map.put("participatedAt", p.getParticipatedAt());
                    return map;
                })
                .collect(Collectors.toList());
    }

    // 2. 관리자용 기능 (Admin)
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @Transactional
    public Event createEvent(EventRequestDto dto) {
        Event event = Event.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .eventType(dto.getEventType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .discountRate(dto.getDiscountRate())
                .couponCode(dto.getCouponCode())
                .pointAmount(dto.getPointAmount())
                .maxParticipants(dto.getMaxParticipants())
                .priorityBuyers(dto.getPriorityBuyers())
                .winProbability(dto.getWinProbability())
                .createdAt(LocalDateTime.now())
                .build();
        return eventRepository.save(event);
    }

    @Transactional
    public Event updateEvent(Long id, EventRequestDto dto) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("이벤트를 찾을 수 없습니다."));

        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setEventType(dto.getEventType());
        event.setStartDate(dto.getStartDate());
        event.setEndDate(dto.getEndDate());
        event.setDiscountRate(dto.getDiscountRate());
        event.setCouponCode(dto.getCouponCode());
        event.setPointAmount(dto.getPointAmount());
        event.setMaxParticipants(dto.getMaxParticipants());
        event.setPriorityBuyers(dto.getPriorityBuyers());
        event.setWinProbability(dto.getWinProbability());

        return event;
    }

    @Transactional
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }
}