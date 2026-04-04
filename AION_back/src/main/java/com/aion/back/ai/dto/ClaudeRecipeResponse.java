package com.aion.back.ai.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ClaudeRecipeResponse {
    private String perfumeName;
    private String concept;
    private String story;
    private List<RecipeItem> topNotes;
    private List<RecipeItem> middleNotes;
    private List<RecipeItem> baseNotes;
    private String concentration;        // EDP / EDT / EDC
    private String recommendedSeason;
    private String recommendedOccasion;
    private String aiAnalysis;           // Claude의 전체 분석 텍스트

    @Getter
    @Builder
    public static class RecipeItem {
        private String ingredientName;
        private Double ratio;
        private String reason;
    }
}
