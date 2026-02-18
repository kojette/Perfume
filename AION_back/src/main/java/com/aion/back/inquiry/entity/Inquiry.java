package com.aion.back.inquiry.entity;

import com.aion.back.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"Inquiries\"")
@DynamicInsert
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inquiry_id")
    private Long inquiryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String type; // product, delivery, etc.

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(nullable = false)
    private String status; // pending, processing, completed, cancelled

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(name = "assigned_to")
    private String assignedTo; // 답변한 관리자 이름

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
