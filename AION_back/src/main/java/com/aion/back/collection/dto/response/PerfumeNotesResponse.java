package com.aion.back.collection.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 향수 노트 응답 DTO
 * top / middle / base 노트 이름 목록을 반환
 */
@Getter
@Builder
public class PerfumeNotesResponse {

    private Long perfumeId;
    private List<String> top;
    private List<String> middle;
    private List<String> base;
}
