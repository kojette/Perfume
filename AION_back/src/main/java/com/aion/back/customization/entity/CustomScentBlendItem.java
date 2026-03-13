package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 커스텀 향 조합 아이템 (향료 1개 + 비율)
 * 테이블: Custom_Scent_Blend_Items
 */
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

    // Ingredients.ingredient_id 참조
    @Column(name = "ingredient_id", nullable = false)
    private Long ingredientId;

    // 프론트에서 정규화된 비율 (합산 100 기준, 소수점 허용)
    @Column(name = "ratio", nullable = false)
    private Double ratio;
}
