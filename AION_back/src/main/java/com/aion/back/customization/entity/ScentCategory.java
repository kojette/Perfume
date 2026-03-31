package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "\"Scent_Categories\"")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScentCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name", nullable = false, length = 100)
    private String categoryName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_active")
    private Boolean isActive;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", referencedColumnName = "category_id",
                insertable = false, updatable = false)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<Ingredient> ingredients = new ArrayList<>();
}