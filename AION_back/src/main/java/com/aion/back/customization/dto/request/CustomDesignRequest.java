package com.aion.back.customization.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 커스텀 디자인 저장/수정 요청 DTO
 * POST /api/custom/designs
 * PUT  /api/custom/designs/{designId}
 */
@Getter
@NoArgsConstructor
public class CustomDesignRequest {

    private String name;             // 디자인 이름 (필수)
    private String bottleKey;        // 공병 키 (필수)
    private String bottleColor;      // 공병 색상 hex
    private String engravingText;    // 각인 문구 (null이면 각인 없음)
    private String objectsJson;      // 오브젝트 레이어 JSON
    private String previewImageUrl;  // 캔버스 base64 또는 Storage URL

    // 가격 항목 (프론트에서 계산 후 전송)
    private Integer bottlePrice;
    private Integer printingPrice;
    private Integer stickerPrice;
    private Integer engravingPrice;
    private Integer totalPrice;
}
