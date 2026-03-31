package com.aion.back.point.entity;
import com.aion.back.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity
@Table(name = "\"Points_History\"")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Point {

    @Id

    @GeneratedValue(strategy = GenerationType.IDENTITY)

    @Column(name = "point_history_id")

    private Long pointHistoryId;

    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "user_id", nullable = false)

    private Member member;

    @Column(nullable = false)

    private int amount;

    @Column(name = "balance_after", nullable = false)

    private int balanceAfter;

    @Column(nullable = false, length = 100)

    private String reason;

    @Column(name = "reason_detail", length = 255)

    private String reasonDetail;

    @Column(name = "related_order_id")

    private Long relatedOrderId;

    @org.hibernate.annotations.ColumnTransformer(write = "?::point_status_enum")

    @Enumerated(EnumType.STRING)

    @Column(name = "status", columnDefinition = "point_status_enum default 'AVAILABLE'")

    @Builder.Default

    private PointStatus status = PointStatus.AVAILABLE;

    @CreationTimestamp

    @Column(name = "created_at", updatable = false)

    private LocalDateTime createdAt;

    @Column(name = "expire_at")

    private LocalDateTime expireAt;

    @Column(name = "used_at")

    private LocalDateTime usedAt;

    public enum PointStatus {
        AVAILABLE,
        USED,
        EXPIRED
    }
}