package com.aion.back.customization.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 관리자 공병 추가/수정 요청 DTO
 * POST /api/custom/bottles       (관리자 전용)
 * PATCH /api/custom/bottles/{id} (관리자 전용)
 */
@Getter
@NoArgsConstructor
public class CustomBottleRequest {

    private String name;        // 공병 이름 (필수)
    private String shape;       // BottleSVG shape 키값 (필수)
    private Integer basePrice;  // 기본 가격
    private Boolean isActive;   // 활성 여부 (PATCH 시 사용)
}
