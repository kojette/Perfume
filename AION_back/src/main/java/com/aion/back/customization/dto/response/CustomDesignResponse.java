package com.aion.back.customization.dto.response;

import com.aion.back.customization.entity.CustomDesign;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CustomDesignResponse {

    private Long designId;
    private Long userId;
    private String name;
    private String bottleKey;
    private String bottleColor;
    private String engravingText;
    private String objectsJson;
    private String previewImageUrl;
    private Integer bottlePrice;
    private Integer printingPrice;
    private Integer stickerPrice;
    private Integer engravingPrice;
    private Integer totalPrice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CustomDesignResponse from(CustomDesign design) {
        return CustomDesignResponse.builder()
                .designId(design.getDesignId())
                .userId(design.getUserId())
                .name(design.getName())
                .bottleKey(design.getBottleKey())
                .bottleColor(design.getBottleColor())
                .engravingText(design.getEngravingText())
                .objectsJson(design.getObjectsJson())
                .previewImageUrl(design.getPreviewImageUrl())
                .bottlePrice(design.getBottlePrice())
                .printingPrice(design.getPrintingPrice())
                .stickerPrice(design.getStickerPrice())
                .engravingPrice(design.getEngravingPrice())
                .totalPrice(design.getTotalPrice())
                .createdAt(design.getCreatedAt())
                .updatedAt(design.getUpdatedAt())
                .build();
    }
}
