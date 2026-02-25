package com.aion.back.event.repository;

import com.aion.back.event.entity.Event;
import com.aion.back.event.entity.EventParticipation;
import com.aion.back.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventParticipationRepository extends JpaRepository<EventParticipation, Long> {
    boolean existsByMemberAndEvent(Member member, Event event);
    List<EventParticipation> findAllByMember(Member member);
}