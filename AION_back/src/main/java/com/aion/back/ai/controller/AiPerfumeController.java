package com.aion.back.ai.controller;

import com.aion.back.ai.dto.*;
import com.aion.back.ai.service.AiPerfumeService;
import com.aion.back.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * AI 향수 기능 컨트롤러
 *
 * [탭 2] POST /api/ai/image-to-scent
 *   Gemini Vision: 이미지 → 무드 분석 + 기성 향수 추천
 *
 * [탭 3] POST /api/ai/claude-blend  (SSE)
 *   파이프라인: 사용자 입력 → Gemini 키워드 추출 → Supabase 재료 검색 → Claude 조향 스트리밍
 *
 * [탭 3] POST /api/ai/gemini-evaluate
 *   슬라이더 조절 후 Gemini가 이전/현재 레시피 비교 평가
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiPerfumeController {

    private final AiPerfumeService aiPerfumeService;

    // ── 탭 2: Gemini 이미지 분석 ──────────────────────────────────────
    @PostMapping(value = "/image-to-scent", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ImageToScentResponse> imageToScent(
            @RequestPart("image") MultipartFile image) {
        log.info("이미지→향수 요청: {}", image.getOriginalFilename());
        return ApiResponse.success("이미지 향수 분석 완료", aiPerfumeService.analyzeImageToScent(image));
    }

    // ── 탭 3: 조향 파이프라인 (Gemini → Supabase → Claude SSE) ─────────
    @PostMapping(value = "/claude-blend", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter claudeBlendStream(@RequestBody ClaudeBlendRequest request) {
        log.info("AI 조향 파이프라인 시작 - 프롬프트: {}", request.getUserPrompt());
        return aiPerfumeService.streamClaudeBlend(request);
    }

    // ── 탭 3: Gemini 레시피 변경 평가 (슬라이더 조절 시) ─────────────────
    @PostMapping("/gemini-evaluate")
    public ApiResponse<String> geminiEvaluate(@RequestBody ClaudeBlendRequest request) {
        log.info("Gemini 레시피 변경 평가 요청");
        return ApiResponse.success("평가 완료", aiPerfumeService.evaluateRecipeChange(request));
    }
}
