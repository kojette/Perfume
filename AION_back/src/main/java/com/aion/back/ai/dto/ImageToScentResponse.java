package com.aion.back.ai.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ImageToScentResponse {
    private String analysisText;
    private List<NoteItem> topNotes;
    private List<NoteItem> middleNotes;
    private List<NoteItem> baseNotes;
    private List<String> keywords;
    private String mood;
    private List<RecommendedPerfume> recommendedPerfumes;

    /** 탭2 이미지 분석 결과 노트 아이템 (이름 + Gemini가 산정한 비율) */
    @Getter
    @Builder
    public static class NoteItem {
        private String name;
        private double ratio; // 0.0 ~ 1.0, 전체 노트 합계 = 1.0
    }

    @Getter
    @Builder
    public static class RecommendedPerfume {
        private Long id;
        private String name;
        private String nameEn;
        private String brand;
        private String imageUrl;
        private Integer price;
        private String matchReason; // AI가 왜 이 향수를 추천했는지
    }
}