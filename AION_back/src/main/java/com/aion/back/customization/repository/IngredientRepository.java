package com.aion.back.customization.repository;

import com.aion.back.customization.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    List<Ingredient> findByIsActiveTrueOrderByCategoryIdAscDisplayOrderAsc();
    List<Ingredient> findByCategoryIdAndIsActiveTrueOrderByDisplayOrderAsc(Long categoryId);
}
