package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 관리자가 추가하는 공병 템플릿 엔티티
 * 기본 10종은 프론트에 하드코딩, 추가분만 이 테이블에 저장
 */
@Entity
@Table(name = "\"Custom_Bottles\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomBottle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bottle_id")
    private Long bottleId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    // CustomizationEditor BottleSVG의 shape 키값과 동일해야 함
    @Column(name = "shape", nullable = false, length = 50)
    private String shape;

    @Column(name = "base_price", nullable = false)
    private Integer basePrice;

    @Column(name = "is_active")
    private Boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
