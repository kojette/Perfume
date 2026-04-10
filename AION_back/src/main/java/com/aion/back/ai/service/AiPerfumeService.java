package com.aion.back.ai.service;

import com.aion.back.ai.dto.*;
import com.aion.back.customization.entity.Ingredient;
import com.aion.back.customization.entity.ScentCategory;
import com.aion.back.customization.repository.IngredientRepository;
import com.aion.back.customization.repository.ScentCategoryRepository;
import com.aion.back.perfume.entity.Perfume;
import com.aion.back.perfume.repository.PerfumeRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiPerfumeService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${claude.api.key:}")
    private String claudeApiKey;

    private final PerfumeRepository perfumeRepository;
    private final IngredientRepository ingredientRepository;
    private final ScentCategoryRepository scentCategoryRepository;
    private final ObjectMapper objectMapper;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
    private static final String CLAUDE_URL =
            "https://api.anthropic.com/v1/messages";

    // ══════════════════════════════════════════════════════════════
    // 탭 2: GEMINI 이미지 → 향수 추천 (기존 유지)
    // ══════════════════════════════════════════════════════════════

    public ImageToScentResponse analyzeImageToScent(MultipartFile image) {
        try {
            String base64 = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";

            String prompt = """
                당신은 전문 조향사입니다. 이 이미지를 보고 향수 전문가 관점에서 분석해주세요.
                
                반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요:
                {
                  "mood": "이미지의 전반적인 분위기 (한 문장)",
                  "analysisText": "이미지 향수 분석 설명 (2-3문장, 한국어)",
                  "keywords": ["키워드1", "키워드2", "키워드3"],
                  "topNotes": ["탑노트1", "탑노트2"],
                  "middleNotes": ["미들노트1", "미들노트2"],
                  "baseNotes": ["베이스노트1", "베이스노트2"]
                }
                
                노트는 반드시 실제 향수 재료명(예: 베르가못, 장미, 샌달우드, 머스크 등)으로 답하세요.
                """;

            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64))
                    )
                )),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", 512,
                    "responseMimeType", "application/json"
                )
            );

            String responseText = callGemini(body);
            return parseGeminiImageResponse(responseText);

        } catch (Exception e) {
            log.error("Gemini 이미지 분석 오류", e);
            throw new RuntimeException("이미지 분석에 실패했습니다: " + e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 탭 3: STEP 1 - Gemini로 재료 키워드 15개 추출
    // 빠른 단순 응답만 요청 (Flash Lite 적합)
    // ══════════════════════════════════════════════════════════════

    private List<String> extractIngredientKeywords(String userPrompt) throws Exception {
        String prompt = String.format("""
            사용자가 원하는 향수 감성: "%s"
            
            이 감성에 어울리는 향수 재료명만 15개 이내로 추출하세요.
            재료명은 실제 향수 재료 이름이어야 합니다 (예: 베르가못, 장미, 샌달우드, 머스크, 바닐라 등).
            
            반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:
            {"keywords": ["재료1", "재료2", "재료3", ...]}
            """, userPrompt);

        Map<String, Object> body = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", prompt))
            )),
            "generationConfig", Map.of(
                "temperature", 0.3,          // 낮을수록 일관된 재료명 반환
                "maxOutputTokens", 200,      // 키워드만 뽑으니 짧게
                "responseMimeType", "application/json"
            )
        );

        String raw = callGemini(body);
        String clean = raw.strip()
                .replaceAll("^```json\\s*", "")
                .replaceAll("^```\\s*", "")
                .replaceAll("\\s*```$", "");

        JsonNode node = objectMapper.readTree(clean);
        return toStringList(node.path("keywords"));
    }

    // ══════════════════════════════════════════════════════════════
    // 탭 3: STEP 2 - Supabase Ingredient 테이블에서 키워드 매칭 재료 검색
    // 개수 제한 없이 매칭되는 재료 전부 반환
    // ══════════════════════════════════════════════════════════════

    private List<Ingredient> searchIngredientsByKeywords(List<String> keywords) {
        // 카테고리 정보를 함께 쓰기 위해 카테고리 맵 로드
        Map<Long, String> categoryNames = scentCategoryRepository.findActiveWithIngredients()
                .stream()
                .collect(Collectors.toMap(
                        ScentCategory::getCategoryId,
                        ScentCategory::getCategoryName,
                        (a, b) -> a
                ));

        // 키워드별 검색 후 합산 (중복 제거)
        Set<Long> seen = new LinkedHashSet<>();
        List<Ingredient> result = new ArrayList<>();

        for (String keyword : keywords) {
            String trimmed = keyword.trim();
            if (trimmed.isEmpty()) continue;
            List<Ingredient> found = ingredientRepository.findActiveByNameContaining(trimmed);
            for (Ingredient ing : found) {
                if (seen.add(ing.getIngredientId())) {
                    result.add(ing);
                }
            }
        }

        log.info("키워드 {} 개 → 매칭 재료 {} 개", keywords.size(), result.size());
        return result;
    }

    // ══════════════════════════════════════════════════════════════
    // 탭 3: STEP 3 - Claude SSE 스트리밍 조향
    // 사용자 원본 프롬프트 + 실제 Supabase 재료 목록 전달
    // ══════════════════════════════════════════════════════════════

    public SseEmitter streamClaudeBlend(ClaudeBlendRequest request) {
        SseEmitter emitter = new SseEmitter(180_000L); // 3분 타임아웃

        new Thread(() -> {
            try {
                String userPrompt = request.getUserPrompt();
                if (userPrompt == null || userPrompt.isBlank()) {
                    // 메시지 히스토리에서 마지막 user 메시지를 프롬프트로 사용
                    userPrompt = request.getMessages() == null ? "" :
                            request.getMessages().stream()
                                    .filter(m -> "user".equals(m.getRole()))
                                    .reduce((a, b) -> b)
                                    .map(ClaudeBlendRequest.ChatMessage::getContent)
                                    .orElse("");
                }

                // ── STEP 1: Gemini로 키워드 추출 ──────────────────────
                emitter.send(SseEmitter.event()
                        .data(objectMapper.writeValueAsString(Map.of("status", "extracting_keywords"))));

                List<String> keywords = extractIngredientKeywords(userPrompt);
                log.info("Gemini 추출 키워드: {}", keywords);

                // ── STEP 2: Supabase에서 재료 검색 ────────────────────
                emitter.send(SseEmitter.event()
                        .data(objectMapper.writeValueAsString(Map.of("status", "searching_ingredients"))));

                List<Ingredient> matched = searchIngredientsByKeywords(keywords);

                // 카테고리 이름 맵 (프롬프트에 포함)
                Map<Long, String> catNames = scentCategoryRepository.findActiveWithIngredients()
                        .stream()
                        .collect(Collectors.toMap(
                                ScentCategory::getCategoryId,
                                ScentCategory::getCategoryName,
                                (a, b) -> a
                        ));

                // 재료 목록을 Claude 프롬프트용 문자열로 변환
                // 형식: "ingredientId|이름|카테고리" → Claude가 ingredientId 기준으로 선택
                String ingredientList = matched.stream()
                        .map(i -> String.format("  - ID:%d | %s | 계열:%s",
                                i.getIngredientId(),
                                i.getName(),
                                catNames.getOrDefault(i.getCategoryId(), "기타")))
                        .collect(Collectors.joining("\n"));

                if (ingredientList.isBlank()) {
                    ingredientList = "  (매칭된 재료가 없습니다. 일반적인 향수 재료를 사용해주세요)";
                }

                // 매칭된 재료 목록을 프론트에도 전송 (슬라이더 패널 구성용)
                List<Map<String, Object>> ingredientData = matched.stream()
                        .map(i -> Map.<String, Object>of(
                                "ingredientId", i.getIngredientId(),
                                "name", i.getName(),
                                "category", catNames.getOrDefault(i.getCategoryId(), "기타")
                        ))
                        .collect(Collectors.toList());

                emitter.send(SseEmitter.event()
                        .data(objectMapper.writeValueAsString(Map.of(
                                "status", "ingredients_found",
                                "ingredients", ingredientData,
                                "count", matched.size()
                        ))));

                // ── STEP 3: Claude 조향 스트리밍 ──────────────────────
                String systemPrompt = buildClaudeSystemPrompt(userPrompt, ingredientList);
                List<Map<String, Object>> messages = buildClaudeMessages(request.getMessages(), userPrompt);

                Map<String, Object> body = new LinkedHashMap<>();
                body.put("model", "claude-sonnet-4-20250514");
                body.put("max_tokens", 2000);
                body.put("stream", true);
                body.put("system", systemPrompt);
                body.put("messages", messages);

                String jsonBody = objectMapper.writeValueAsString(body);

                HttpClient client = HttpClient.newHttpClient();
                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(CLAUDE_URL))
                        .header("Content-Type", "application/json")
                        .header("x-api-key", claudeApiKey)
                        .header("anthropic-version", "2023-06-01")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<InputStream> response = client.send(
                        httpRequest, HttpResponse.BodyHandlers.ofInputStream());

                if (response.statusCode() != 200) {
                    emitter.completeWithError(new RuntimeException("Claude API 오류: " + response.statusCode()));
                    return;
                }

                // Claude 응답 스트리밍
                StringBuilder fullResponse = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {

                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (!line.startsWith("data: ")) continue;
                        String data = line.substring(6).trim();
                        if (data.equals("[DONE]")) break;

                        try {
                            JsonNode event = objectMapper.readTree(data);
                            String type = event.path("type").asText();

                            if ("content_block_delta".equals(type)) {
                                String delta = event.path("delta").path("text").asText("");
                                if (!delta.isEmpty()) {
                                    fullResponse.append(delta);
                                    emitter.send(SseEmitter.event()
                                            .data(objectMapper.writeValueAsString(Map.of("delta", delta))));
                                }
                            } else if ("message_stop".equals(type)) {
                                // 스트리밍 완료 후 <recipe> 태그 파싱해서 전송
                                String recipeJson = extractAndParseRecipe(fullResponse.toString());
                                emitter.send(SseEmitter.event()
                                        .data(objectMapper.writeValueAsString(Map.of(
                                                "done", true,
                                                "recipeJson", recipeJson
                                        ))));
                                break;
                            }
                        } catch (Exception ignored) {}
                    }
                }

                emitter.complete();

            } catch (Exception e) {
                log.error("Claude 조향 파이프라인 오류", e);
                try {
                    emitter.send(SseEmitter.event()
                            .data(objectMapper.writeValueAsString(Map.of("error", e.getMessage()))));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            }
        }).start();

        return emitter;
    }

    // ══════════════════════════════════════════════════════════════
    // 탭 3: Gemini 레시피 변경 평가
    // 슬라이더 조절 후 이전/현재 레시피 비교 → 향 변화 조언
    // ══════════════════════════════════════════════════════════════

    public String evaluateRecipeChange(ClaudeBlendRequest request) {
        try {
            ClaudeBlendRequest.RecipeSnapshot prev = request.getPreviousRecipe();
            ClaudeBlendRequest.RecipeSnapshot curr = request.getCurrentRecipe();

            if (prev == null || curr == null) {
                return "레시피 정보가 부족합니다.";
            }

            String prevDesc = formatRecipeForPrompt(prev);
            String currDesc = formatRecipeForPrompt(curr);

            String prompt = String.format("""
                전문 조향사로서 두 향수 레시피를 비교하고, 비율 변경이 향에 어떤 영향을 주는지 2-3문장으로 평가해주세요.
                한국어로, 간결하고 시적으로 표현해주세요.
                
                [이전 레시피]
                %s
                
                [현재 레시피]
                %s
                
                변경된 부분을 중심으로 향이 어떻게 달라졌는지 조언해주세요.
                """, prevDesc, currDesc);

            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", 300
                )
            );

            // Gemini는 JSON 모드 없이 자연어 응답
            String url = GEMINI_URL + "?key=" + geminiApiKey;
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request2 = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = client.send(request2, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            return root.path("candidates").get(0)
                       .path("content").path("parts").get(0)
                       .path("text").asText("평가를 생성할 수 없습니다.");

        } catch (Exception e) {
            log.error("Gemini 레시피 평가 오류", e);
            return "평가 중 오류가 발생했습니다.";
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 내부 유틸
    // ══════════════════════════════════════════════════════════════

    private String buildClaudeSystemPrompt(String userPrompt, String ingredientList) {
        return String.format("""
            당신은 30년 경력의 전문 조향사입니다.
            
            [고객 요청]
            %s
            
            [사용 가능한 실제 재료 목록 - Supabase DB 기준]
            반드시 아래 목록에서만 재료를 선택하세요. ID가 있는 재료만 사용할 수 있습니다.
            %s
            
            [조향 원칙]
            - 반드시 위 재료 목록에 있는 재료만 사용하세요
            - 고객 요청의 감성/분위기에 맞게 재료를 선택하세요
            - 탑/미들/베이스 노트 비율 합이 반드시 100%%가 되어야 합니다
            - 조향 이유를 시적으로 설명해주세요
            
            [응답 형식]
            대화 형식으로 조향 과정을 설명하고, 마지막에 반드시 아래 태그를 포함하세요:
            <recipe>
            {
              "perfumeName": "창의적인 향수 이름",
              "concept": "한 줄 콘셉트",
              "story": "향수 스토리 2-3문장",
              "topNotes": [{"ingredientId": ID, "ingredientName": "이름", "ratio": 0.XX, "reason": "선택 이유"}],
              "middleNotes": [{"ingredientId": ID, "ingredientName": "이름", "ratio": 0.XX, "reason": "선택 이유"}],
              "baseNotes": [{"ingredientId": ID, "ingredientName": "이름", "ratio": 0.XX, "reason": "선택 이유"}],
              "concentration": "EDP",
              "recommendedSeason": "봄/가을",
              "recommendedOccasion": "데이트, 산책"
            }
            </recipe>
            """, userPrompt, ingredientList);
    }

    private List<Map<String, Object>> buildClaudeMessages(
            List<ClaudeBlendRequest.ChatMessage> msgs, String userPrompt) {

        if (msgs == null || msgs.isEmpty()) {
            // 첫 요청: 사용자 프롬프트로 시작
            return List.of(Map.of("role", "user", "content",
                    userPrompt != null && !userPrompt.isBlank()
                            ? userPrompt
                            : "저만의 향수를 만들어주세요."));
        }
        return msgs.stream()
                .map(m -> Map.<String, Object>of("role", m.getRole(), "content", m.getContent()))
                .collect(Collectors.toList());
    }

    // Claude 응답에서 <recipe>...</recipe> 태그 파싱
    private String extractAndParseRecipe(String fullText) {
        try {
            int start = fullText.indexOf("<recipe>");
            int end = fullText.indexOf("</recipe>");
            if (start == -1 || end == -1) return "{}";

            String json = fullText.substring(start + 8, end).strip();
            // JSON 유효성 확인
            objectMapper.readTree(json);
            return json;
        } catch (Exception e) {
            log.warn("레시피 파싱 실패: {}", e.getMessage());
            return "{}";
        }
    }

    private String formatRecipeForPrompt(ClaudeBlendRequest.RecipeSnapshot recipe) {
        StringBuilder sb = new StringBuilder();
        appendNotes(sb, "탑", recipe.getTopNotes());
        appendNotes(sb, "미들", recipe.getMiddleNotes());
        appendNotes(sb, "베이스", recipe.getBaseNotes());
        return sb.toString();
    }

    private void appendNotes(StringBuilder sb, String label,
            List<ClaudeBlendRequest.RecipeSnapshot.NoteItem> notes) {
        if (notes == null || notes.isEmpty()) return;
        sb.append(label).append("노트: ");
        notes.forEach(n -> sb.append(n.getIngredientName())
                .append("(").append(Math.round(n.getRatio() * 100)).append("%) "));
        sb.append("\n");
    }

    // Gemini 공통 호출
    private String callGemini(Map<String, Object> body) throws Exception {
        String url = GEMINI_URL + "?key=" + geminiApiKey;
        String jsonBody = objectMapper.writeValueAsString(body);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Gemini API 오류 {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API 오류: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.path("candidates").get(0)
                   .path("content").path("parts").get(0)
                   .path("text").asText();
    }

    // 탭 2 이미지 응답 파싱
    private ImageToScentResponse parseGeminiImageResponse(String jsonText) throws Exception {
        String clean = jsonText.strip()
                .replaceAll("^```json\\s*", "")
                .replaceAll("^```\\s*", "")
                .replaceAll("\\s*```$", "");

        JsonNode node = objectMapper.readTree(clean);
        List<String> topNotes    = toStringList(node.path("topNotes"));
        List<String> middleNotes = toStringList(node.path("middleNotes"));
        List<String> keywords    = toStringList(node.path("keywords"));

        List<String> searchTerms = new ArrayList<>(topNotes);
        searchTerms.addAll(middleNotes);
        searchTerms.addAll(keywords);

        List<ImageToScentResponse.RecommendedPerfume> matched =
                matchPerfumesFromDb(searchTerms, node.path("mood").asText(""));

        return ImageToScentResponse.builder()
                .mood(node.path("mood").asText(""))
                .analysisText(node.path("analysisText").asText(""))
                .topNotes(topNotes)
                .middleNotes(middleNotes)
                .baseNotes(toStringList(node.path("baseNotes")))
                .keywords(keywords)
                .recommendedPerfumes(matched)
                .build();
    }

    private List<ImageToScentResponse.RecommendedPerfume> matchPerfumesFromDb(
            List<String> keywords, String mood) {

        List<Perfume> all = perfumeRepository
                .findByIsActiveTrue(PageRequest.of(0, 200))
                .getContent();

        return all.stream()
                .map(p -> {
                    String haystack = String.join(" ",
                            Optional.ofNullable(p.getName()).orElse(""),
                            Optional.ofNullable(p.getNameEn()).orElse(""),
                            Optional.ofNullable(p.getDescription()).orElse("")
                    ).toLowerCase();
                    long score = keywords.stream()
                            .filter(kw -> kw != null && haystack.contains(kw.toLowerCase()))
                            .count();
                    return Map.entry(p, score);
                })
                .filter(e -> e.getValue() > 0)
                .sorted(Map.Entry.<Perfume, Long>comparingByValue().reversed())
                .limit(4)
                .map(e -> {
                    Perfume p = e.getKey();
                    return ImageToScentResponse.RecommendedPerfume.builder()
                            .id(p.getPerfumeId())
                            .name(p.getName())
                            .nameEn(p.getNameEn())
                            .brand(p.getBrand() != null ? p.getBrand().getBrandName() : "")
                            .imageUrl(p.getImageUrl())
                            .price(p.getSalePrice() != null ? p.getSalePrice() : p.getPrice())
                            .matchReason(mood + " 무드와 어울리는 향수")
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<String> toStringList(JsonNode arr) {
        List<String> result = new ArrayList<>();
        if (arr.isArray()) arr.forEach(n -> result.add(n.asText()));
        return result;
    }
}
