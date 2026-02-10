package com.aion.back.member.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.dto.request.MemberRegistrationRequest;
import com.aion.back.member.dto.request.ProfileUpdateRequest;
import com.aion.back.member.dto.request.WithdrawalRequest;
import com.aion.back.member.dto.response.MemberProfileResponse;
import com.aion.back.member.dto.response.MyPageResponse;
import com.aion.back.member.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MemberController {

    @Autowired
    private MemberService memberService;

    // ===== 기존 메서드들 (그대로 유지) =====

    @GetMapping("/check-email")
    public ApiResponse<Boolean> checkEmail(@RequestParam("email") String email) {
        boolean isDuplicated = memberService.isEmailDuplicated(email);
        return ApiResponse.success("이메일 중복 체크 결과입니다.", isDuplicated);
    }

    @GetMapping("/mypage")
    public ApiResponse<MyPageResponse> getMyPage(@RequestParam("userId") Long userId) {
        MyPageResponse response = memberService.getMyPageInfo(userId);
        return ApiResponse.success("마이페이지 정보를 성공적으로 불러왔습니다.", response);
    }

    @PostMapping("/register")
    public ApiResponse<String> register(@RequestBody MemberRegistrationRequest request) {
        memberService.registerMember(request);
        return ApiResponse.success("사용자 정보가 우리 DB에 성공적으로 등록되었습니다.");
    }

    // ===== 새로 추가하는 메서드들 =====

    /**
     * 토큰으로 프로필 조회
     */
    @GetMapping("/profile")
    public ApiResponse<MemberProfileResponse> getProfile(
            @RequestHeader("Authorization") String token) {

        try {
            MemberProfileResponse profile = memberService.getProfileByToken(token);
            return ApiResponse.success("프로필 조회 성공", profile);
        } catch (Exception e) {
            return ApiResponse.error("프로필 조회 실패: " + e.getMessage());
        }
    }

    /**
     * 회원 정보 수정
     */
    @PutMapping("/profile")
    public ApiResponse<MemberProfileResponse> updateProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody ProfileUpdateRequest request) {
        
        try {
            MemberProfileResponse updated = memberService.updateProfile(token, request);
            return ApiResponse.success("회원 정보 수정 완료", updated);
        } catch (Exception e) {
            return ApiResponse.error("회원 정보 수정 실패: " + e.getMessage());
        }
    }

    /**
     * 회원 탈퇴
     */
    // MemberController.java

    @DeleteMapping("/account")
    public ApiResponse<String> deleteAccount(
            @RequestHeader("Authorization") String token,
            @RequestBody WithdrawalRequest request) { // DTO 추가

        try {
            memberService.deleteAccount(token, request.getReason());
            return ApiResponse.success("회원 탈퇴가 완료되었습니다.");
        } catch (Exception e) {
            return ApiResponse.error("회원 탈퇴 실패: " + e.getMessage());
        }
    }
}