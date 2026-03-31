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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_email", referencedColumnName = "email")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    private boolean won;

    @Column(name = "participated_at")
    private LocalDateTime participatedAt;
}