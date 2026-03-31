package com.aion.back.customization.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CustomDesignRequest {
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
}