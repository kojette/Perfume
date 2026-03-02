package com.aion.back.customization.controller;

import com.aion.back.customization.dto.request.CustomBottleRequest;
import com.aion.back.customization.dto.request.CustomDesignRequest;
import com.aion.back.customization.dto.response.CustomBottleResponse;
import com.aion.back.customization.dto.response.CustomDesignResponse;
import com.aion.back.customization.service.DesignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 커스터마이징 API
 *
 * [공병 템플릿]
 *   GET    /api/custom/bottles              - 활성 공병 목록 (일반 유저)
 *   GET    /api/custom/bottles/all          - 전체 공병 목록 (관리자)
 *   POST   /api/custom/bottles              - 공병 추가 (관리자)
 *   PATCH  /api/custom/bottles/{id}/toggle  - 활성/비활성 토글 (관리자)
 *   DELETE /api/custom/bottles/{id}         - 공병 삭제 (관리자)
 *
 * [커스텀 디자인]
 *   GET    /api/custom/designs              - 내 디자인 목록
 *   GET    /api/custom/designs/{id}         - 디자인 단건 조회
 *   POST   /api/custom/designs              - 디자인 저장
 *   PUT    /api/custom/designs/{id}         - 디자인 수정
 *   DELETE /api/custom/designs/{id}         - 디자인 삭제
 */
@RestController
@RequestMapping("/api/custom")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomizationController {

    private final DesignService designService;

    // ────────────────────────────────────────────────────────
    // 공병 템플릿 API
    // ────────────────────────────────────────────────────────

    /**
     * 활성화된 관리자 추가 공병 목록 (일반 유저용)
     * GET /api/custom/bottles
     */
    @GetMapping("/bottles")
    public ResponseEntity<Map<String, Object>> getActiveBottles() {
        List<CustomBottleResponse> bottles = designService.getActiveBottles();
        return ResponseEntity.ok(successResponse(bottles));
    }

    /**
     * 전체 공병 목록 (관리자용, 비활성 포함)
     * GET /api/custom/bottles/all
     */
    @GetMapping("/bottles/all")
    public ResponseEntity<Map<String, Object>> getAllBottles() {
        List<CustomBottleResponse> bottles = designService.getAllBottles();
        return ResponseEntity.ok(successResponse(bottles));
    }

    /**
     * 공병 추가 (관리자)
     * POST /api/custom/bottles
     * Body: { name, shape, basePrice }
     */
    @PostMapping("/bottles")
    public ResponseEntity<Map<String, Object>> createBottle(@RequestBody CustomBottleRequest request) {
        CustomBottleResponse bottle = designService.createBottle(request);
        return ResponseEntity.ok(successResponse(bottle));
    }

    /**
     * 공병 활성/비활성 토글 (관리자)
     * PATCH /api/custom/bottles/{bottleId}/toggle
     */
    @PatchMapping("/bottles/{bottleId}/toggle")
    public ResponseEntity<Map<String, Object>> toggleBottle(@PathVariable Long bottleId) {
        CustomBottleResponse bottle = designService.toggleBottleActive(bottleId);
        return ResponseEntity.ok(successResponse(bottle));
    }

    /**
     * 공병 삭제 (관리자)
     * DELETE /api/custom/bottles/{bottleId}
     */
    @DeleteMapping("/bottles/{bottleId}")
    public ResponseEntity<Map<String, Object>> deleteBottle(@PathVariable Long bottleId) {
        designService.deleteBottle(bottleId);
        return ResponseEntity.ok(successResponse("삭제되었습니다."));
    }

    // ────────────────────────────────────────────────────────
    // 커스텀 디자인 API (JWT로 userId 추출 필요)
    // ────────────────────────────────────────────────────────

    /**
     * 내 디자인 목록 조회
     * GET /api/custom/designs?userId={userId}
     *
     * 실제 구현 시 JWT 필터에서 userId를 추출하여 사용.
     * 기존 프로젝트의 JWT 유틸리티가 있다면 @AuthenticationPrincipal 또는
     * HttpServletRequest에서 userId attribute를 꺼내는 방식으로 교체하세요.
     */
    @GetMapping("/designs")
    public ResponseEntity<Map<String, Object>> getMyDesigns(
            @RequestHeader("X-User-Id") Long userId) {
        List<CustomDesignResponse> designs = designService.getMyDesigns(userId);
        return ResponseEntity.ok(successResponse(designs));
    }

    /**
     * 디자인 단건 조회
     * GET /api/custom/designs/{designId}
     */
    @GetMapping("/designs/{designId}")
    public ResponseEntity<Map<String, Object>> getDesign(
            @PathVariable Long designId,
            @RequestHeader("X-User-Id") Long userId) {
        CustomDesignResponse design = designService.getDesign(designId, userId);
        return ResponseEntity.ok(successResponse(design));
    }

    /**
     * 디자인 저장
     * POST /api/custom/designs
     * Body: CustomDesignRequest
     */
    @PostMapping("/designs")
    public ResponseEntity<Map<String, Object>> saveDesign(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody CustomDesignRequest request) {
        CustomDesignResponse design = designService.saveDesign(userId, request);
        return ResponseEntity.ok(successResponse(design));
    }

    /**
     * 디자인 수정
     * PUT /api/custom/designs/{designId}
     * Body: CustomDesignRequest
     */
    @PutMapping("/designs/{designId}")
    public ResponseEntity<Map<String, Object>> updateDesign(
            @PathVariable Long designId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody CustomDesignRequest request) {
        CustomDesignResponse design = designService.updateDesign(designId, userId, request);
        return ResponseEntity.ok(successResponse(design));
    }

    /**
     * 디자인 삭제
     * DELETE /api/custom/designs/{designId}
     */
    @DeleteMapping("/designs/{designId}")
    public ResponseEntity<Map<String, Object>> deleteDesign(
            @PathVariable Long designId,
            @RequestHeader("X-User-Id") Long userId) {
        designService.deleteDesign(designId, userId);
        return ResponseEntity.ok(successResponse("삭제되었습니다."));
    }

    // ────────────────────────────────────────────────────────
    // 공통 응답 헬퍼
    // ────────────────────────────────────────────────────────
    private Map<String, Object> successResponse(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", data);
        return result;
    }
}
