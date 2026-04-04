package com.aion.back.ai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ClaudeBlendRequest {
    private List<ChatMessage> messages;
    private List<String> availableIngredients; // Supabase에서 가져온 재료 목록 (top 20개만)

    @Getter
    @NoArgsConstructor
    public static class ChatMessage {
        private String role;    // "user" | "assistant"
        private String content;
    }
}
