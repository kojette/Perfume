package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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