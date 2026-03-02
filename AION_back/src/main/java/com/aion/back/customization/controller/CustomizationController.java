package com.aion.back.customization.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.customization.dto.request.CustomBottleRequest;
import com.aion.back.customization.dto.request.CustomDesignRequest;
import com.aion.back.customization.dto.response.CustomBottleResponse;
import com.aion.back.customization.dto.response.CustomDesignResponse;
import com.aion.back.customization.service.DesignService;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 커스터마이징 API
 * 인증 방식: CartController / OrderController 와 동일하게
 *   @RequestHeader("Authorization") String token
 *   → memberService.getMemberEntityByToken(token) 으로 Member 조회
 *   → member.getUserId() 로 userId 사용
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
    private final MemberService memberService; // 기존 프로젝트 인증 방식 사용

    // ─────────────────────────────────────────────────────────
    // 공병 템플릿 API (공병 목록은 토큰 불필요)
    // ─────────────────────────────────────────────────────────

    /**
     * 활성화된 관리자 추가 공병 목록 (일반 유저용, 인증 불필요)
     * GET /api/custom/bottles
     */
    @GetMapping("/bottles")
    public ApiResponse<List<CustomBottleResponse>> getActiveBottles() {
        return ApiResponse.success("공병 목록 조회 성공", designService.getActiveBottles());
    }

    /**
     * 전체 공병 목록 (관리자용, 비활성 포함)
     * GET /api/custom/bottles/all
     */
    @GetMapping("/bottles/all")
    public ApiResponse<List<CustomBottleResponse>> getAllBottles(
            @RequestHeader("Authorization") String token) {
        // 관리자 여부는 추후 role 체크로 강화 가능. 현재는 로그인 여부만 확인
        memberService.getMemberEntityByToken(token);
        return ApiResponse.success("전체 공병 목록 조회 성공", designService.getAllBottles());
    }

    /**
     * 공병 추가 (관리자)
     * POST /api/custom/bottles
     */
    @PostMapping("/bottles")
    public ApiResponse<CustomBottleResponse> createBottle(
            @RequestHeader("Authorization") String token,
            @RequestBody CustomBottleRequest request) {
        memberService.getMemberEntityByToken(token); // 인증 확인
        return ApiResponse.success("공병 추가 성공", designService.createBottle(request));
    }

    /**
     * 공병 활성/비활성 토글 (관리자)
     * PATCH /api/custom/bottles/{bottleId}/toggle
     */
    @PatchMapping("/bottles/{bottleId}/toggle")
    public ApiResponse<CustomBottleResponse> toggleBottle(
            @RequestHeader("Authorization") String token,
            @PathVariable Long bottleId) {
        memberService.getMemberEntityByToken(token); // 인증 확인
        return ApiResponse.success("공병 상태 변경 성공", designService.toggleBottleActive(bottleId));
    }

    /**
     * 공병 삭제 (관리자)
     * DELETE /api/custom/bottles/{bottleId}
     */
    @DeleteMapping("/bottles/{bottleId}")
    public ApiResponse<String> deleteBottle(
            @RequestHeader("Authorization") String token,
            @PathVariable Long bottleId) {
        memberService.getMemberEntityByToken(token); // 인증 확인
        designService.deleteBottle(bottleId);
        return ApiResponse.success("공병 삭제 성공", "삭제되었습니다.");
    }

    // ─────────────────────────────────────────────────────────
    // 커스텀 디자인 API
    // CartController와 동일: token → getMemberEntityByToken → userId
    // ─────────────────────────────────────────────────────────

    /**
     * 내 디자인 목록 조회
     * GET /api/custom/designs
     */
    @GetMapping("/designs")
    public ApiResponse<List<CustomDesignResponse>> getMyDesigns(
            @RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("디자인 목록 조회 성공", designService.getMyDesigns(member.getUserId()));
    }

    /**
     * 디자인 단건 조회
     * GET /api/custom/designs/{designId}
     */
    @GetMapping("/designs/{designId}")
    public ApiResponse<CustomDesignResponse> getDesign(
            @RequestHeader("Authorization") String token,
            @PathVariable Long designId) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("디자인 조회 성공", designService.getDesign(designId, member.getUserId()));
    }

    /**
     * 디자인 저장 (신규)
     * POST /api/custom/designs
     */
    @PostMapping("/designs")
    public ApiResponse<CustomDesignResponse> saveDesign(
            @RequestHeader("Authorization") String token,
            @RequestBody CustomDesignRequest request) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("디자인 저장 성공", designService.saveDesign(member.getUserId(), request));
    }

    /**
     * 디자인 수정
     * PUT /api/custom/designs/{designId}
     */
    @PutMapping("/designs/{designId}")
    public ApiResponse<CustomDesignResponse> updateDesign(
            @RequestHeader("Authorization") String token,
            @PathVariable Long designId,
            @RequestBody CustomDesignRequest request) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("디자인 수정 성공", designService.updateDesign(designId, member.getUserId(), request));
    }

    /**
     * 디자인 삭제
     * DELETE /api/custom/designs/{designId}
     */
    @DeleteMapping("/designs/{designId}")
    public ApiResponse<String> deleteDesign(
            @RequestHeader("Authorization") String token,
            @PathVariable Long designId) {
        Member member = memberService.getMemberEntityByToken(token);
        designService.deleteDesign(designId, member.getUserId());
        return ApiResponse.success("디자인 삭제 성공", "삭제되었습니다.");
    }
}