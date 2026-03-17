package com.aion.back.signature.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.signature.dto.SignatureDetailResponse;
import com.aion.back.signature.dto.SignatureSaveRequest;
import com.aion.back.signature.dto.SignatureSummaryResponse;
import com.aion.back.signature.service.SignatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 시그니처 API  —  /api/signature
 *
 * ─── 조회 ──────────────────────────────────────────────────────────────
 *  GET  /api/signature                  전체 목록 (관리자, 토큰 필요)
 *  GET  /api/signature/active           활성 시그니처 단건 (공개, 토큰 불필요)
 *  GET  /api/signature/{id}             단건 상세 (관리자, 토큰 필요)
 *
 * ─── CUD (관리자 전용, 토큰 필수) ──────────────────────────────────────
 *  POST   /api/signature                생성
 *  PUT    /api/signature/{id}           수정
 *  PATCH  /api/signature/{id}/active    활성화 토글  ?activate=true|false
 *  DELETE /api/signature/{id}           삭제
 */
@RestController
@RequestMapping("/api/signature")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SignatureController {

    private final SignatureService signatureService;

    // ── 조회 ─────────────────────────────────────────────────

    /**
     * 전체 목록 (관리자)
     * GET /api/signature
     */
    @GetMapping
    public ApiResponse<List<SignatureSummaryResponse>> getList(
            @RequestHeader("Authorization") String token) {
        return ApiResponse.success("시그니처 목록 조회 성공", signatureService.getList(token));
    }

    /**
     * 활성 시그니처 단건 (공개 — 토큰 불필요)
     * GET /api/signature/active
     */
    @GetMapping("/active")
    public ApiResponse<SignatureDetailResponse> getActive() {
        SignatureDetailResponse data = signatureService.getActive();
        if (data == null) {
            return ApiResponse.success("활성 시그니처 없음", null);
        }
        return ApiResponse.success("활성 시그니처 조회 성공", data);
    }

    /**
     * 단건 상세 (관리자 편집용)
     * GET /api/signature/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<SignatureDetailResponse> getDetail(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID id) {
        return ApiResponse.success("시그니처 상세 조회 성공", signatureService.getDetail(token, id));
    }

    // ── CUD ──────────────────────────────────────────────────

    /**
     * 생성
     * POST /api/signature
     */
    @PostMapping
    public ApiResponse<SignatureDetailResponse> create(
            @RequestHeader("Authorization") String token,
            @RequestBody SignatureSaveRequest request) {
        return ApiResponse.success("시그니처 생성 성공", signatureService.create(token, request));
    }

    /**
     * 수정
     * PUT /api/signature/{id}
     */
    @PutMapping("/{id}")
    public ApiResponse<SignatureDetailResponse> update(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID id,
            @RequestBody SignatureSaveRequest request) {
        return ApiResponse.success("시그니처 수정 성공", signatureService.update(token, id, request));
    }

    /**
     * 활성화/비활성화 토글
     * PATCH /api/signature/{id}/active?activate=true
     */
    @PatchMapping("/{id}/active")
    public ApiResponse<String> toggleActive(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID id,
            @RequestParam boolean activate) {
        signatureService.toggleActive(token, id, activate);
        return ApiResponse.success(activate ? "활성화 성공" : "비활성화 성공", null);
    }

    /**
     * 삭제
     * DELETE /api/signature/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<String> delete(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID id) {
        signatureService.delete(token, id);
        return ApiResponse.success("삭제 성공", "삭제되었습니다.");
    }
}
