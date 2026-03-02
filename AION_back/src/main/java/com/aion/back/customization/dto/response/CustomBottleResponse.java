package com.aion.back.customization.dto.response;

import com.aion.back.customization.entity.CustomBottle;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CustomBottleResponse {

    private Long bottleId;
    private String name;
    private String shape;
    private Integer basePrice;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static CustomBottleResponse from(CustomBottle bottle) {
        return CustomBottleResponse.builder()
                .bottleId(bottle.getBottleId())
                .name(bottle.getName())
                .shape(bottle.getShape())
                .basePrice(bottle.getBasePrice())
                .isActive(bottle.getIsActive())
                .createdAt(bottle.getCreatedAt())
                .build();
    }
}
