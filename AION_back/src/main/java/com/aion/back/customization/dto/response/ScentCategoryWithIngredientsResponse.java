package com.aion.back.customization.dto.response;

import com.aion.back.customization.entity.ScentCategory;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ScentCategoryWithIngredientsResponse {

    private Long categoryId;
    private String categoryName;
    private String description;
    private Integer displayOrder;
    private List<IngredientResponse> ingredients;

    public static ScentCategoryWithIngredientsResponse of(ScentCategory category, List<IngredientResponse> ingredients) {
        return ScentCategoryWithIngredientsResponse.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .description(category.getDescription())
                .displayOrder(category.getDisplayOrder())
                .ingredients(ingredients)
                .build();
    }
}