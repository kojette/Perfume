package com.aion.back.member.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Users\"") // 수퍼베이스의 기존 Users 테이블과 연결
@Getter @Setter
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;
    private String nickname;

    @Column(name = "agreement_terms")
    private boolean agreementTerms;

    @Column(name = "is_withdrawn")
    private boolean isWithdrawn = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}