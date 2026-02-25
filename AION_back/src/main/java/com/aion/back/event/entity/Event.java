package com.aion.back.event.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Events\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Event {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "coupon_code")
    private String couponCode;

    @Column(name = "discount_rate")
    private Integer discountRate;

    @Column(name = "point_amount")
    private Integer pointAmount;

    @Column(name = "win_probability")
    private Double winProbability;

    @Column(name = "priority_buyers")
    private Boolean priorityBuyers;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}