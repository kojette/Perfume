package com.aion.back.ai.controller;

import com.aion.back.ai.dto.*;
import com.aion.back.ai.service.AiPerfumeService;
import com.aion.back.common.response.ApiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;


@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiPerfumeController {

    // ── 탭 2, 탭 3 ───────────────────────────────────────────────────────────
    private final AiPerfumeService aiPerfumeService;

    // ── 향 카드: GeminiScentCardController에서 이식 ──────────────────────────
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ══════════════════════════════════════════════════════════════════════════
    // 탭 2: Gemini 이미지 분석
    // ══════════════════════════════════════════════════════════════════════════

    @PostMapping(value = "/image-to-scent", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ImageToScentResponse> imageToScent(
            @RequestPart("image") MultipartFile image) {
        log.info("이미지→향수 요청: {}", image.getOriginalFilename());
        return ApiResponse.success("이미지 향수 분석 완료", aiPerfumeService.analyzeImageToScent(image));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 탭 3: 조향 파이프라인 (Gemini → Supabase → Claude SSE)
    // ══════════════════════════════════════════════════════════════════════════

    @PostMapping(value = "/claude-blend", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter claudeBlendStream(@RequestBody ClaudeBlendRequest request) {
        log.info("AI 조향 파이프라인 시작 - 프롬프트: {}", request.getUserPrompt());
        return aiPerfumeService.streamClaudeBlend(request);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 탭 3: Gemini 레시피 변경 평가 (슬라이더 조절 시)
    // ══════════════════════════════════════════════════════════════════════════

    @PostMapping("/gemini-evaluate")
    public ApiResponse<String> geminiEvaluate(@RequestBody ClaudeBlendRequest request) {
        log.info("Gemini 레시피 변경 평가 요청");
        return ApiResponse.success("평가 완료", aiPerfumeService.evaluateRecipeChange(request));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 향 카드: Gemini 향 카드 생성 (구 GeminiScentCardController 통합)
    // ══════════════════════════════════════════════════════════════════════════

    // ── DTO ──────────────────────────────────────────────────────────────────

    /** 프론트에서 보내는 blend 요청 */
    public record ScentCardRequest(BlendDto blend) {}

    public record BlendDto(
        String name,
        String concentration,
        Integer volumeMl,
        List<IngredientItemDto> items
    ) {}

    public record IngredientItemDto(
        Long   ingredientId,
        String ingredientName,
        Double ratio          // 0~1 또는 0~100, 비율로만 사용
    ) {}

    // ── Endpoint ─────────────────────────────────────────────────────────────

    @PostMapping("/gemini-scent-card")
    public ResponseEntity<?> generateScentCard(@RequestBody ScentCardRequest request) {
        try {
            BlendDto blend = request.blend();
            if (blend == null || blend.items() == null || blend.items().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "향 재료가 없습니다."));
            }

            String   prompt    = buildScentCardPrompt(blend);
            String   geminiRaw = callGeminiForScentCard(prompt);
            JsonNode cardData  = parseScentCardResponse(geminiRaw);

            return ResponseEntity.ok(Map.of("data", cardData));

        } catch (Exception e) {
            log.error("Gemini 향 카드 생성 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ── 향 카드 프롬프트 빌더 ─────────────────────────────────────────────────

    private String buildScentCardPrompt(BlendDto blend) {
        List<IngredientItemDto> items = blend.items();
        StringBuilder sb = new StringBuilder();

        sb.append("당신은 향수 조향사이자 감각적인 작가입니다.\n");
        sb.append("아래 향수 조합 정보를 분석하여, 반드시 순수 JSON만 반환하세요 (마크다운 백틱 없이).\n\n");

        sb.append("향수 이름: ").append(blend.name()).append("\n");
        sb.append("농도: ").append(blend.concentration()).append("\n");
        sb.append("재료 목록 (이름 / 비율):\n");
        for (IngredientItemDto item : items) {
            sb.append("  - ").append(item.ingredientName())
              .append(" (비율: ").append(item.ratio()).append(")\n");
        }

        sb.append("\n다음 JSON 형식으로만 응답하세요:\n");
        sb.append("{\n");
        sb.append("  \"tagline\": \"<감성적 한줄 소개. 예: '겨울 숲을 걷다가 발견한 홍차 가든', '밤바다와 밤하늘 사이에서'. ");
        sb.append("시적이고 감각적으로, 브랜드 광고 카피 수준으로 작성. 20자 내외.>\",\n");
        sb.append("  \"symbolColor\": \"<이 향수 전체를 대표하는 단 하나의 hex 색상. ");
        sb.append("향수의 감성, 계절, 무드를 반영. 예: #d4a2a2, #7ca8b5, #c9a15e 등 다양하게.>\",\n");
        sb.append("  \"ingredientColors\": [\n");
        sb.append("    <재료 순서 그대로, 각 재료의 감각적 연상 색상을 hex로. ");
        sb.append("재료가 ").append(items.size()).append("개이므로 정확히 ").append(items.size()).append("개 항목. ");
        sb.append("비슷한 색이 겹치지 않도록 다양하게. 예: [\"#e8c87a\", \"#6b9e7a\", \"#d4829a\"]>\n");
        sb.append("  ],\n");
        sb.append("  \"topNotes\": [\"<탑노트 재료명1>\", \"<탑노트 재료명2>\"],\n");
        sb.append("  \"middleNotes\": [\"<미들노트 재료명1>\"],\n");
        sb.append("  \"baseNotes\": [\"<베이스노트 재료명1>\", \"<베이스노트 재료명2>\"]\n");
        sb.append("}\n\n");
        sb.append("탑/미들/베이스 분류는 향수학적 지식으로 판단하세요. ");
        sb.append("모든 재료가 반드시 세 그룹 중 하나에 포함되어야 합니다.\n");
        sb.append("ingredientColors 배열 길이는 반드시 재료 수(").append(items.size()).append(")와 일치해야 합니다.\n");
        sb.append("JSON 외 다른 텍스트는 절대 포함하지 마세요.");

        return sb.toString();
    }

// 추가 (기존 private String callGeminiForScentCard 바로 위)
    private static final String GEMINI_CARD_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
    private String callGeminiForScentCard(String prompt) {
        String url = GEMINI_CARD_URL + "?key=" + geminiApiKey;

        ObjectNode requestBody = objectMapper.createObjectNode();
        ArrayNode  contents    = requestBody.putArray("contents");
        ObjectNode content     = contents.addObject();
        ArrayNode  parts       = content.putArray("parts");
        parts.addObject().put("text", prompt);

        ObjectNode genConfig = requestBody.putObject("generationConfig");
        genConfig.put("temperature",     0.7);
        genConfig.put("maxOutputTokens", 1024);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity;
        try {
            entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
        } catch (Exception e) {
            throw new RuntimeException("Gemini 요청 직렬화 실패", e);
        }

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini API 응답 오류: " + response.getStatusCode());
        }
        return response.getBody();
    }

    // ── Gemini 응답 파싱 (향 카드 전용) ─────────────────────────────────────

    private JsonNode parseScentCardResponse(String geminiRaw) throws Exception {
        JsonNode root = objectMapper.readTree(geminiRaw);

        String text = root
                .path("candidates").get(0)
                .path("content")
                .path("parts").get(0)
                .path("text").asText();

        text = text.trim();
        if (text.startsWith("```")) {
            text = text.replaceAll("^```[a-zA-Z]*\\n?", "").replaceAll("```$", "").trim();
        }

        return objectMapper.readTree(text);
    }
}