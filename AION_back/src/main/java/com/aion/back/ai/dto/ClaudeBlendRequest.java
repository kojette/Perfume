package com.aion.back.ai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ClaudeBlendRequest {

    // 채팅 메시지 히스토리
    private List<ChatMessage> messages;

    // 사용자 원본 프롬프트 (Gemini 키워드 추출 + 재료 검색에 사용)
    // 첫 메시지에서는 이걸 기준으로 파이프라인 실행
    private String userPrompt;

    // Gemini 평가 요청 시: 이전 레시피와 새 레시피를 비교
    private RecipeSnapshot previousRecipe;
    private RecipeSnapshot currentRecipe;

    @Getter
    @NoArgsConstructor
    public static class ChatMessage {
        private String role;    // "user" | "assistant"
        private String content;
    }

    // 슬라이더 조절 후 Gemini 평가 요청에 사용하는 레시피 스냅샷
    @Getter
    @NoArgsConstructor
    public static class RecipeSnapshot {
        private List<NoteItem> topNotes;
        private List<NoteItem> middleNotes;
        private List<NoteItem> baseNotes;

        @Getter
        @NoArgsConstructor
        public static class NoteItem {
            private String ingredientName;
            private double ratio;
        }
    }
}
