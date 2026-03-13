package com.aion.back.customization.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 커스텀 향 조합 저장 요청
 * POST /api/custom/scent-blends
 */
@Getter
@NoArgsConstructor
public class CustomScentBlendRequest {

    private String name;           // 조합 이름 (필수)
    private String concentration;  // EDP / EDT / EDC / COLOGNE
    private Integer volumeMl;      // 50~100
    private Integer totalPrice;    // 프론트에서 계산
    private List<BlendItemRequest> items;

    @Getter
    @NoArgsConstructor
    public static class BlendItemRequest {
        private Long ingredientId;
        private Double ratio; // 정규화된 비율 (합 = 100)
    }
}
