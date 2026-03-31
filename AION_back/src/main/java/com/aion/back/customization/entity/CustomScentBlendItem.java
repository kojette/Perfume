package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "\"Custom_Scent_Blend_Items\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomScentBlendItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blend_id", nullable = false)
    private CustomScentBlend blend;

    @Column(name = "ingredient_id", nullable = false)
    private Long ingredientId;

    @Column(name = "ratio", nullable = false)
    private Double ratio;
}