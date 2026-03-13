package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 향수 재료 (향료 개별 항목)
 * 테이블: Ingredients
 */
@Entity
@Table(name = "\"Ingredients\"")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_id")
    private Long ingredientId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category_id")  // ✅ scent_category_id → category_id (실제 DB 컬럼명)
    private Long categoryId;

    @Transient  // ✅ DB에 없는 컬럼 → JPA 매핑에서 제외
    private Long scentId;

    @Column(name = "origin", length = 100)
    private String origin;

    @Column(name = "is_natural")
    private Boolean isNatural;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "display_order")
    private Integer displayOrder;
}