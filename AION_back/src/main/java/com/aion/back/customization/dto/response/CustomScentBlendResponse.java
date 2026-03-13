package com.aion.back.customization.dto.response;

import com.aion.back.customization.entity.CustomScentBlend;
import com.aion.back.customization.entity.CustomScentBlendItem;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class CustomScentBlendResponse {

    private Long blendId;
    private Long userId;
    private String name;
    private String concentration;
    private Integer volumeMl;
    private Integer totalPrice;
    private List<BlendItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Builder
    public static class BlendItemResponse {
        private Long itemId;
        private Long ingredientId;
        private Double ratio;

        public static BlendItemResponse from(CustomScentBlendItem item) {
            return BlendItemResponse.builder()
                    .itemId(item.getItemId())
                    .ingredientId(item.getIngredientId())
                    .ratio(item.getRatio())
                    .build();
        }
    }

    public static CustomScentBlendResponse from(CustomScentBlend blend) {
        return CustomScentBlendResponse.builder()
                .blendId(blend.getBlendId())
                .userId(blend.getUserId())
                .name(blend.getName())
                .concentration(blend.getConcentration())
                .volumeMl(blend.getVolumeMl())
                .totalPrice(blend.getTotalPrice())
                .items(blend.getItems().stream()
                        .map(BlendItemResponse::from)
                        .collect(Collectors.toList()))
                .createdAt(blend.getCreatedAt())
                .updatedAt(blend.getUpdatedAt())
                .build();
    }
}
