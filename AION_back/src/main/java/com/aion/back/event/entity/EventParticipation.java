package com.aion.back.event.entity;

import com.aion.back.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"EventParticipations\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class EventParticipation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 누가 참여했는지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_email", referencedColumnName = "email")
    private Member member;

    // 어떤 이벤트에 참여했는지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    // 당첨 여부
    private boolean won;

    // 참여 시간
    @Column(name = "participated_at")
    private LocalDateTime participatedAt;
}