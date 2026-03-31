package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "\"Custom_Scent_Blends\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomScentBlend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blend_id")
    private Long blendId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "concentration", nullable = false, length = 20)
    private String concentration;

    @Column(name = "volume_ml", nullable = false)
    private Integer volumeMl;

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "blend", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CustomScentBlendItem> items = new ArrayList<>();
}