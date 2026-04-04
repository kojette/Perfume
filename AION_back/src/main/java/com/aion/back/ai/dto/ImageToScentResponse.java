package com.aion.back.ai.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ImageToScentResponse {
    private String analysisText;
    private List<String> topNotes;
    private List<String> middleNotes;
    private List<String> baseNotes;
    private List<String> keywords;
    private String mood;
    private List<RecommendedPerfume> recommendedPerfumes;

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
