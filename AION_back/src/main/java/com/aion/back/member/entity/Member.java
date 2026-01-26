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

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    private String name;
    private String nickname;
    private String phone;
    private String gender;

    @Column(name = "profile_image")
    private String profileImage;

    @Column(name = "account_status")
    private String accountStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}