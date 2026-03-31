package com.aion.back.customization.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.customization.dto.request.CustomScentBlendRequest;
import com.aion.back.customization.dto.response.CustomScentBlendResponse;
import com.aion.back.customization.dto.response.ScentCategoryWithIngredientsResponse;
import com.aion.back.customization.service.ScentBlendService;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/custom")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScentBlendController {

    private final ScentBlendService scentBlendService;
    private final MemberService memberService;

    @GetMapping("/scents")
    public ApiResponse<List<ScentCategoryWithIngredientsResponse>> getScentCategories() {
        return ApiResponse.success("향 카테고리 조회 성공", scentBlendService.getScentCategoriesWithIngredients());
    }

    @GetMapping("/scent-blends")
    public ApiResponse<List<CustomScentBlendResponse>> getMyBlends(
            @RequestHeader("Authorization") String token) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("조합 목록 조회 성공", scentBlendService.getMyBlends(member.getUserId()));
    }

    @PostMapping("/scent-blends")
    public ApiResponse<CustomScentBlendResponse> saveBlend(
            @RequestHeader("Authorization") String token,
            @RequestBody CustomScentBlendRequest request) {
        Member member = memberService.getMemberEntityByToken(token);
        return ApiResponse.success("향 조합 저장 성공", scentBlendService.saveBlend(member.getUserId(), request));
    }

    @DeleteMapping("/scent-blends/{blendId}")
    public ApiResponse<String> deleteBlend(
            @RequestHeader("Authorization") String token,
            @PathVariable Long blendId) {
        Member member = memberService.getMemberEntityByToken(token);
        scentBlendService.deleteBlend(blendId, member.getUserId());
        return ApiResponse.success("향 조합 삭제 성공", "삭제되었습니다.");
    }
}