package com.aion.back.customization.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CustomBottleRequest {
    private String name;
    private String shape;
    private Integer basePrice;
    private Boolean isActive;
}