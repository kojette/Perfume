package com.aion.back.customization.repository;

import com.aion.back.customization.entity.ScentCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ScentCategoryRepository extends JpaRepository<ScentCategory, Long> {


    @Query("""
        SELECT DISTINCT sc FROM ScentCategory sc
        LEFT JOIN FETCH sc.ingredients i
        WHERE sc.isActive = true
          AND (i IS NULL OR i.isActive = true)
        ORDER BY sc.displayOrder ASC, i.displayOrder ASC
    """)
    List<ScentCategory> findActiveWithIngredients();
}