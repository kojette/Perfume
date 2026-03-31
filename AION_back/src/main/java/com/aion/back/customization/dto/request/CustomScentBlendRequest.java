package com.aion.back.customization.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CustomScentBlendRequest {
    private String name;
    private String concentration;
    private Integer volumeMl;
    private Integer totalPrice;
    private List<BlendItemRequest> items;

    @Getter
    @NoArgsConstructor
    public static class BlendItemRequest {
        private Long ingredientId;
        private Double ratio;
    }
}