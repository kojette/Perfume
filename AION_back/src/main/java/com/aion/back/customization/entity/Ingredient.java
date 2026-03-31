package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(name = "category_id")
    private Long categoryId;

    @Transient
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