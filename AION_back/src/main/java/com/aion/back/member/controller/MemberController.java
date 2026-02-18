package com.aion.back.member.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.dto.request.MemberRegistrationRequest;
import com.aion.back.member.dto.request.ProfileUpdateRequest;
import com.aion.back.member.dto.request.WithdrawalRequest;
import com.aion.back.member.dto.response.MemberProfileResponse;
import com.aion.back.member.dto.response.MyPageResponse;
import com.aion.back.member.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MemberController {

    @Autowired
    private MemberService memberService;

    // ===== 기존 메서드들 (그대로 유지) =====

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        try {
            // 기존의 return memberService.isEmailDuplicated(email); 대신 아래 코드로 변경
            memberService.checkEmailAvailability(email);

            // 에러 없이 통과하면 가입 가능한 상태
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "가입 가능한 이메일입니다.",
                    "data", false // 중복되지 않음
            ));
        } catch (RuntimeException e) {
            // 서비스에서 throw한 "탈퇴 후 30일 이내..." 메시지를 여기서 잡아서 응답
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage(),
                    "data", true // 중복 혹은 제한 상태
            ));
        }
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