package com.aion.back.customization.dto.response;

import com.aion.back.customization.entity.Ingredient;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class IngredientResponse {

    private Long ingredientId;
    private String name;
    private String description;
    private Long categoryId;
    private String origin;
    private Boolean isNatural;

    public static IngredientResponse from(Ingredient ingredient) {
        return IngredientResponse.builder()
                .ingredientId(ingredient.getIngredientId())
                .name(ingredient.getName())
                .description(ingredient.getDescription())
                .categoryId(ingredient.getCategoryId())
                .origin(ingredient.getOrigin())
                .isNatural(ingredient.getIsNatural())
                .build();
    }
}
