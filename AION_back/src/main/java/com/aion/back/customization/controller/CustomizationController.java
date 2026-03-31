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

@RestController
@RequestMapping("/api/custom")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomizationController {

    private final DesignService designService;
    private final MemberService memberService;

    @GetMapping("/bottles")
    public ApiResponse<List<CustomBottleResponse>> getActiveBottles() {
        return ApiResponse.success("공병 목록 조회 성공", designService.getActiveBottles());
    }

    @GetMapping("/bottles/all")
    public ApiResponse<List<CustomBottleResponse>> getAllBottles(
            @RequestHeader("Authorization") String token) {
        memberService.getMemberEntityByToken(token);
        return ApiResponse.success("전체 공병 목록 조회 성공", designService.getAllBottles());
    }

    @PostMapping("/bottles")
    public ApiResponse<CustomBottleResponse> createBottle(
            @RequestHeader("Authorization") String token,
            @RequestBody CustomBottleRequest request) {
        memberService.getMemberEntityByToken(token);
        return ApiResponse.success("공병 추가 성공", designService.createBottle(request));
    }

    @PatchMapping("/bottles/{bottleId}/toggle")
    public ApiResponse<CustomBottleResponse> toggleBottle(
            @RequestHeader("Authorization") String token,
            @PathVariable Long bottleId) {
        memberService.getMemberEntityByToken(token);
        return ApiResponse.success("공병 상태 변경 성공", designService.toggleBottleActive(bottleId));
    }

    @DeleteMapping("/bottles/{bottleId}")
    public ApiResponse<String> deleteBottle(
            @RequestHeader("Authorization") String token,
            @PathVariable Long bottleId) {
        memberService.getMemberEntityByToken(token);
        designService.deleteBottle(bottleId);
        return ApiResponse.success("공병 삭제 성공", "삭제되었습니다.");
    }

    @GetMapping("/designs")
    public ApiResponse<List<CustomDesignResponse>> getMyDesigns(
            @RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("디자인 목록 조회 성공", designService.getMyDesigns(member.getUserId()));
    }

    @GetMapping("/designs/{designId}")
    public ApiResponse<CustomDesignResponse> getDesign(
            @RequestHeader("Authorization") String token,
            @PathVariable Long designId) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("디자인 조회 성공", designService.getDesign(designId, member.getUserId()));
    }

    @PostMapping("/designs")
    public ApiResponse<CustomDesignResponse> saveDesign(
            @RequestHeader("Authorization") String token,
            @RequestBody CustomDesignRequest request) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("디자인 저장 성공", designService.saveDesign(member.getUserId(), request));
    }

    @PutMapping("/designs/{designId}")
    public ApiResponse<CustomDesignResponse> updateDesign(
            @RequestHeader("Authorization") String token,
            @PathVariable Long designId,
            @RequestBody CustomDesignRequest request) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("디자인 수정 성공", designService.updateDesign(designId, member.getUserId(), request));
    }

    @DeleteMapping("/designs/{designId}")
    public ApiResponse<String> deleteDesign(
            @RequestHeader("Authorization") String token,
            @PathVariable Long designId) {
        Member member = memberService.getMemberEntityByToken(token);
        designService.deleteDesign(designId, member.getUserId());
        return ApiResponse.success("디자인 삭제 성공", "삭제되었습니다.");
    }
}