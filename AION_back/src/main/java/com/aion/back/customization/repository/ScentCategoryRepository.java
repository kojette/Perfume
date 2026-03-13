package com.aion.back.customization.repository;

import com.aion.back.customization.entity.ScentCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ScentCategoryRepository extends JpaRepository<ScentCategory, Long> {

    // ✅ 기존: 단순 조회 (쿼리 1번, 재료 쿼리 별도 1번 = 총 2번)
    // List<ScentCategory> findByIsActiveTrueOrderByDisplayOrderAsc();

    // ✅ 최적화: JOIN FETCH로 카테고리 + 재료를 쿼리 1번에 해결
    @Query("""
        SELECT DISTINCT sc FROM ScentCategory sc
        LEFT JOIN FETCH sc.ingredients i
        WHERE sc.isActive = true
          AND (i IS NULL OR i.isActive = true)
        ORDER BY sc.displayOrder ASC
    """)
    List<ScentCategory> findActiveWithIngredients();
}