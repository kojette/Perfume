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

    @Column(name = "password_hash", nullable = true)
    private String password;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "nickname", nullable = true)
    private String nickname;

    @Column(name = "phone", nullable = false, unique = true)
    private String phone;

    @Column(name = "gender", columnDefinition = "user_gender")
    private String gender;

    @Column(name = "profile_image")
    private String profileImage;

    @Column(name = "account_status", columnDefinition = "user_account_status")
    private String accountStatus;

    @Column(name = "join_date", updatable = false)
    private LocalDateTime joinDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}