package com.aion.back.customization.repository;

import com.aion.back.customization.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    List<Ingredient> findByIsActiveTrueOrderByCategoryIdAscDisplayOrderAsc();

    List<Ingredient> findByCategoryIdAndIsActiveTrueOrderByDisplayOrderAsc(Long categoryId);

    // ── AI 조향 파이프라인용 키워드 검색 ─────────────────────────────
    // 단일 키워드로 재료 name 검색 (LIKE %keyword%)
    @Query("SELECT i FROM Ingredient i WHERE i.isActive = true AND LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Ingredient> findActiveByNameContaining(@Param("keyword") String keyword);

    // 카테고리명 포함해서 조회 (Claude 프롬프트에 카테고리 정보도 넘기기 위함)
    @Query("""
        SELECT i FROM Ingredient i
        WHERE i.isActive = true
        ORDER BY i.categoryId ASC, i.displayOrder ASC
    """)
    List<Ingredient> findAllActive();
}
