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

    @org.hibernate.annotations.ColumnTransformer(write = "?::user_gender")
    @Column(name = "gender")
    private String gender;

    @Column(name = "birth_date")
    private String birthDate;

    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @Column(name = "zipcode", length = 10)
    private String zipcode;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "address_detail", columnDefinition = "TEXT")
    private String addressDetail;

    @org.hibernate.annotations.ColumnTransformer(write = "?::user_account_status")
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status")
    private AccountStatus accountStatus;

    @Column(name = "withdraw_date")
    private LocalDateTime withdrawDate;

    @Column(name = "join_date", updatable = false)
    private LocalDateTime joinDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "total_points", columnDefinition = "integer default 0")
    private Integer totalPoints = 0;

    @Column(name = "warning_count", columnDefinition = "integer default 0")
    private Integer warningCount = 0;

    @Column(name = "warning_level", columnDefinition = "VARCHAR(20) DEFAULT 'normal'")
    private String warningLevel = "normal";
    
    public String getRole() { return this.role; }

    public LocalDateTime getWithdrawDate() {
        return null;
    }

    public void addPoints(int points) {
        if(points <= 0) return;
        this.totalPoints += points;
    }

    public void deductPoints(int points) {
        if (points <= 0) return;
        if (this.totalPoints < points) {
            throw new IllegalStateException(
                    "보유 포인트 부족 (보유: " + this.totalPoints + "P, 차감 요청: " + points + "P)"
            );
        }
        this.totalPoints -= points;
    }
}