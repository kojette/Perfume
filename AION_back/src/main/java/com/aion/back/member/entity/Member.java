package com.aion.back.member.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Users\"")
@Getter @Setter
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "supabase_uid", nullable = false, unique = true)
    private String supabaseUid;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'USER'")
    private String role;

    @Column(name = "password_hash", nullable = true)
    private String password;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "nickname", nullable = true)
    private String nickname;

    @Column(name = "phone", nullable = false, unique = true)
    private String phone;

    @Column(name = "gender")
    private String gender;

    @Column(name = "birth_date")
    private String birthDate;

    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    // 이 부분을 수정! ENUM 타입 명시
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", columnDefinition = "user_account_status")
    private AccountStatus accountStatus;

    @Column(name = "join_date", updatable = false)
    private LocalDateTime joinDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}