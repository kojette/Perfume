package com.aion.back.ai.service;

import com.aion.back.ai.dto.*;
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

    @Value("${claude.api.key:}")//콜론(:) 뒤에 아무것도 없으면 빈 문자열을 기본값으로 쓰겠다는 뜻이에요. 키가 없어도 서버가 실행돼요!
    private String claudeApiKey;

    private final PerfumeRepository perfumeRepository;
    private final ObjectMapper objectMapper;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent";
    private static final String CLAUDE_URL =
            "https://api.anthropic.com/v1/messages";

    // ══════════════════════════════════════════════════════════════
    // GEMINI: 이미지 → 향수
    // ══════════════════════════════════════════════════════════════

    public ImageToScentResponse analyzeImageToScent(MultipartFile image) {
        try {
            // 1. 이미지 → base64 (서버 저장 없이 메모리에서 처리)
            String base64 = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";

            // 2. Gemini Vision 프롬프트 구성
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

            // 3. Gemini API 요청 body 구성
            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inline_data", Map.of(
                            "mime_type", mimeType,
                            "data", base64
                        ))
                    )
                )),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", 512,
                    "responseMimeType", "application/json"//,
                    //"thinkingConfig", Map.of("thinkingLevel", "MINIMAL")  // ← 추가
                )
            );

            String responseText = callGemini(body);
            return parseGeminiResponse(responseText);

        } catch (Exception e) {
            log.error("Gemini 이미지 분석 오류", e);
            throw new RuntimeException("이미지 분석에 실패했습니다: " + e.getMessage());
        }
    }

    public ImageToScentResponse searchByKeyword(String query) {
        try {
            String prompt = String.format("""
                당신은 전문 조향사입니다. 아래 감성/상황을 향수로 표현해주세요.
                
                입력: "%s"
                
                반드시 아래 JSON 형식으로만 응답하세요:
                {
                  "mood": "전반적인 향 무드",
                  "analysisText": "이 느낌을 향수로 표현한 설명 (2-3문장, 한국어)",
                  "keywords": ["키워드1", "키워드2", "키워드3"],
                  "topNotes": ["탑노트1", "탑노트2"],
                  "middleNotes": ["미들노트1", "미들노트2"],
                  "baseNotes": ["베이스노트1", "베이스노트2"]
                }
                
                노트는 반드시 실제 향수 재료명으로 답하세요.
                """, query);

            Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", 512,
                    "responseMimeType", "application/json"//,
                    //"thinkingConfig", Map.of("thinkingLevel", "MINIMAL")  // ← 추가
            )
            );

            String responseText = callGemini(body);
            return parseGeminiResponse(responseText);

        } catch (Exception e) {
            log.error("Gemini 키워드 검색 오류", e);
            throw new RuntimeException("키워드 분석에 실패했습니다: " + e.getMessage());
        }
    }

    // Gemini API 공통 호출
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

    // Gemini JSON 응답 파싱 + DB 향수 매칭
    private ImageToScentResponse parseGeminiResponse(String jsonText) throws Exception {
        // JSON 펜스 제거 (안전하게)
        String clean = jsonText.strip()
                .replaceAll("^```json\\s*", "")
                .replaceAll("^```\\s*", "")
                .replaceAll("\\s*```$", "");

        JsonNode node = objectMapper.readTree(clean);

        List<String> topNotes    = toStringList(node.path("topNotes"));
        List<String> middleNotes = toStringList(node.path("middleNotes"));
        List<String> baseNotes   = toStringList(node.path("baseNotes"));
        List<String> keywords    = toStringList(node.path("keywords"));

        // DB에서 키워드 기반 향수 매칭 (이름/설명에 키워드 포함 여부)
        List<String> searchTerms = new ArrayList<>();
        searchTerms.addAll(topNotes);
        searchTerms.addAll(middleNotes);
        searchTerms.addAll(keywords);

        List<ImageToScentResponse.RecommendedPerfume> matched =
                matchPerfumesFromDb(searchTerms, node.path("mood").asText(""));

        return ImageToScentResponse.builder()
                .mood(node.path("mood").asText(""))
                .analysisText(node.path("analysisText").asText(""))
                .topNotes(topNotes)
                .middleNotes(middleNotes)
                .baseNotes(baseNotes)
                .keywords(keywords)
                .recommendedPerfumes(matched)
                .build();
    }

    // DB 향수 매칭: 키워드로 향수 name/description 검색 후 최대 4개 반환
    private List<ImageToScentResponse.RecommendedPerfume> matchPerfumesFromDb(
            List<String> keywords, String mood) {

        // DB에서 활성 향수 최대 200개 로드 (캐시 가능)
        List<Perfume> all = perfumeRepository
                .findByIsActiveTrue(PageRequest.of(0, 200))
                .getContent();

        // 키워드 매칭 점수 계산
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

    // ══════════════════════════════════════════════════════════════
    // CLAUDE: AI 조향 채팅 - SSE 스트리밍
    // ══════════════════════════════════════════════════════════════

    public SseEmitter streamClaudeBlend(ClaudeBlendRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L); // 2분 타임아웃

        new Thread(() -> {
            try {
                String systemPrompt = buildClaudeSystemPrompt(request.getAvailableIngredients());
                List<Map<String, Object>> messages = buildClaudeMessages(request.getMessages());

                Map<String, Object> body = new LinkedHashMap<>();
                body.put("model", "claude-sonnet-4-20250514");
                body.put("max_tokens", 1500);
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

                // 스트리밍 응답 처리
                HttpResponse<InputStream> response = client.send(
                        httpRequest, HttpResponse.BodyHandlers.ofInputStream());

                if (response.statusCode() != 200) {
                    emitter.completeWithError(new RuntimeException("Claude API 오류: " + response.statusCode()));
                    return;
                }

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {

                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.startsWith("data: ")) {
                            String data = line.substring(6).trim();
                            if (data.equals("[DONE]")) break;

                            try {
                                JsonNode event = objectMapper.readTree(data);
                                String type = event.path("type").asText();

                                if ("content_block_delta".equals(type)) {
                                    String delta = event.path("delta")
                                                        .path("text").asText("");
                                    if (!delta.isEmpty()) {
                                        // 토큰 단위로 프론트에 실시간 전송
                                        emitter.send(SseEmitter.event()
                                                .data(objectMapper.writeValueAsString(
                                                        Map.of("delta", delta))));
                                    }
                                } else if ("message_stop".equals(type)) {
                                    emitter.send(SseEmitter.event()
                                            .data(objectMapper.writeValueAsString(
                                                    Map.of("done", true))));
                                    break;
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                }
                emitter.complete();

            } catch (Exception e) {
                log.error("Claude 스트리밍 오류", e);
                emitter.completeWithError(e);
            }
        }).start();

        return emitter;
    }

    // Claude 비스트리밍: 최종 레시피 JSON 파싱
    public ClaudeRecipeResponse generateRecipe(ClaudeBlendRequest request) {
        try {
            String systemPrompt = buildClaudeRecipeSystemPrompt(request.getAvailableIngredients());
            List<Map<String, Object>> messages = buildClaudeMessages(request.getMessages());

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", "claude-sonnet-4-20250514");
            body.put("max_tokens", 1500);
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

            HttpResponse<String> response = client.send(
                    httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            JsonNode root = objectMapper.readTree(response.body());
            String text = root.path("content").get(0).path("text").asText();

            return parseClaudeRecipe(text);

        } catch (Exception e) {
            log.error("Claude 레시피 생성 오류", e);
            throw new RuntimeException("레시피 생성 실패: " + e.getMessage());
        }
    }

    // ── 프롬프트 빌더 ───────────────────────────────────────────

    private String buildClaudeSystemPrompt(List<String> ingredients) {
        String ingList = ingredients != null && !ingredients.isEmpty()
                ? String.join(", ", ingredients)
                : "베르가못, 레몬, 장미, 자스민, 라벤더, 샌달우드, 시더우드, 머스크, 바닐라, 앰버";

        return String.format("""
            당신은 30년 경력의 전문 조향사입니다. 사용자와 대화하며 세상에 하나뿐인 맞춤 향수를 설계합니다.
            
            [사용 가능한 재료]
            %s
            
            [대화 원칙]
            - 사용자의 취향, 감정, 기억, 상황을 세심하게 파악하세요
            - 향수 전문 용어를 쉽게 설명하면서도 품격 있게 대화하세요
            - 각 재료가 어떤 느낌을 주는지 시적으로 표현하세요
            - 대화가 충분히 진행되면 조향 레시피를 제안하세요
            - 한국어로 대화하되 향수 용어는 영어 병기 가능
            
            [레시피 제안 시 형식]
            대화 중 레시피를 제안할 때는 반드시 아래 태그를 포함하세요:
            <recipe>
            탑노트: 재료명(비율%), 재료명(비율%)
            미들노트: 재료명(비율%), 재료명(비율%)
            베이스노트: 재료명(비율%)
            농도: EDP/EDT/EDC
            계절: 봄/여름/가을/겨울
            </recipe>
            """, ingList);
    }

    private String buildClaudeRecipeSystemPrompt(List<String> ingredients) {
        String ingList = ingredients != null && !ingredients.isEmpty()
                ? String.join(", ", ingredients)
                : "베르가못, 레몬, 장미, 자스민, 라벤더, 샌달우드, 시더우드, 머스크, 바닐라, 앰버";

        return String.format("""
            당신은 전문 조향사입니다. 대화 내용을 바탕으로 최종 조향 레시피를 JSON으로 반환하세요.
            
            [사용 가능한 재료]
            %s
            
            반드시 아래 JSON 형식으로만 응답하세요:
            {
              "perfumeName": "향수 이름 (창의적으로)",
              "concept": "향수 콘셉트 한 줄",
              "story": "향수 스토리 (2-3문장)",
              "topNotes": [{"ingredientName":"재료명","ratio":0.3,"reason":"선택 이유"}],
              "middleNotes": [{"ingredientName":"재료명","ratio":0.4,"reason":"선택 이유"}],
              "baseNotes": [{"ingredientName":"재료명","ratio":0.3,"reason":"선택 이유"}],
              "concentration": "EDP",
              "recommendedSeason": "봄/가을",
              "recommendedOccasion": "데이트, 산책",
              "aiAnalysis": "전체 향수 분석 요약"
            }
            """, ingList);
    }

    private List<Map<String, Object>> buildClaudeMessages(List<ClaudeBlendRequest.ChatMessage> msgs) {
        if (msgs == null || msgs.isEmpty()) {
            return List.of(Map.of("role", "user",
                    "content", "안녕하세요. 저만의 향수를 만들고 싶어요."));
        }
        return msgs.stream()
                .map(m -> Map.<String, Object>of("role", m.getRole(), "content", m.getContent()))
                .collect(Collectors.toList());
    }

    private ClaudeRecipeResponse parseClaudeRecipe(String text) throws Exception {
        String clean = text.strip()
                .replaceAll("^```json\\s*", "")
                .replaceAll("^```\\s*", "")
                .replaceAll("\\s*```$", "");
        JsonNode node = objectMapper.readTree(clean);

        return ClaudeRecipeResponse.builder()
                .perfumeName(node.path("perfumeName").asText(""))
                .concept(node.path("concept").asText(""))
                .story(node.path("story").asText(""))
                .concentration(node.path("concentration").asText("EDP"))
                .recommendedSeason(node.path("recommendedSeason").asText(""))
                .recommendedOccasion(node.path("recommendedOccasion").asText(""))
                .aiAnalysis(node.path("aiAnalysis").asText(""))
                .topNotes(parseRecipeItems(node.path("topNotes")))
                .middleNotes(parseRecipeItems(node.path("middleNotes")))
                .baseNotes(parseRecipeItems(node.path("baseNotes")))
                .build();
    }

    private List<ClaudeRecipeResponse.RecipeItem> parseRecipeItems(JsonNode arr) {
        List<ClaudeRecipeResponse.RecipeItem> list = new ArrayList<>();
        if (arr.isArray()) {
            arr.forEach(n -> list.add(ClaudeRecipeResponse.RecipeItem.builder()
                    .ingredientName(n.path("ingredientName").asText(""))
                    .ratio(n.path("ratio").asDouble(0.0))
                    .reason(n.path("reason").asText(""))
                    .build()));
        }
        return list;
    }

    // ── 유틸 ───────────────────────────────────────────────────

    private List<String> toStringList(JsonNode arr) {
        List<String> result = new ArrayList<>();
        if (arr.isArray()) arr.forEach(n -> result.add(n.asText()));
        return result;
    }
}