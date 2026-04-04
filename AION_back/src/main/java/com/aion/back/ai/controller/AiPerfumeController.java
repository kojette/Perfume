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

import java.util.List;

/**
 * AI 향수 기능 컨트롤러
 *
 * POST /api/ai/image-to-scent   - Gemini Vision: 이미지 → 향수 추천
 * POST /api/ai/keyword-search   - Gemini: 키워드 텍스트 → 향수 추천
 * POST /api/ai/claude-blend     - Claude: AI 조향 채팅 (스트리밍 SSE)
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiPerfumeController {

    private final AiPerfumeService aiPerfumeService;

    /**
     * Gemini Vision: 이미지 분석 → 어울리는 향수 노트 + DB 향수 추천
     * multipart/form-data: image (file)
     */
    @PostMapping(value = "/image-to-scent", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ImageToScentResponse> imageToScent(
            @RequestPart("image") MultipartFile image) {
        log.info("이미지→향수 요청: {}", image.getOriginalFilename());
        return ApiResponse.success("이미지 향수 분석 완료", aiPerfumeService.analyzeImageToScent(image));
    }

    /**
     * Gemini: 자연어 키워드 → 향수 추천 (이미지 없이 텍스트만)
     * { "query": "비 오는 날 카페에서 책 읽는 느낌" }
     */
    @PostMapping("/keyword-search")
    public ApiResponse<ImageToScentResponse> keywordSearch(
            @RequestBody KeywordSearchRequest request) {
        log.info("키워드 향수 검색: {}", request.getQuery());
        return ApiResponse.success("키워드 향수 분석 완료", aiPerfumeService.searchByKeyword(request.getQuery()));
    }

    /**
     * Claude: AI 조향 채팅 - SSE 스트리밍
     * { "messages": [...], "availableIngredients": [...] }
     * 스트리밍으로 조향 레시피를 실시간 전달
     */
    @PostMapping(value = "/claude-blend", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter claudeBlendStream(@RequestBody ClaudeBlendRequest request) {
        log.info("Claude 조향 채팅 스트리밍 시작");
        return aiPerfumeService.streamClaudeBlend(request);
    }

    /**
     * Claude: AI 조향 결과를 구조화된 조향지로 변환 (스트리밍 없이 최종 결과)
     * { "messages": [...], "availableIngredients": [...] }
     */
    @PostMapping("/claude-recipe")
    public ApiResponse<ClaudeRecipeResponse> claudeRecipe(@RequestBody ClaudeBlendRequest request) {
        log.info("Claude 조향 레시피 생성");
        return ApiResponse.success("조향 레시피 생성 완료", aiPerfumeService.generateRecipe(request));
    }
}
