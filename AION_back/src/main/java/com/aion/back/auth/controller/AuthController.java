package com.aion.back.auth.controller;

import com.aion.back.auth.dto.request.LoginRecordRequest;
import com.aion.back.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 프론트엔드 주소에 맞게 수정 필요
public class AuthController {

    private final AuthService authService;

    /**
     * 로그인 기록 저장 (Supabase Auth 후 호출)
     * 프론트엔드에서 Supabase 로그인 성공 후 이 API를 호출
     */
    @PostMapping("/login-record")
    public ResponseEntity<Map<String, Object>> recordLogin(
            @RequestHeader("Authorization") String token,
            @RequestBody LoginRecordRequest request) {

        try {
            authService.recordLoginHistory(token, request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "로그인 기록 저장 완료");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "로그인 기록 저장 실패: " + e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 토큰 검증 (선택적)
     * 프론트엔드에서 토큰이 유효한지 확인하고 싶을 때 사용
     */
    @PostMapping("/verify-token")
    public ResponseEntity<Map<String, Object>> verifyToken(
            @RequestHeader("Authorization") String token) {

        try {
            String email = authService.verifyToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("email", email);
            response.put("message", "유효한 토큰입니다");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "토큰 검증 실패: " + e.getMessage());

            return ResponseEntity.status(401).body(errorResponse);
        }
    }

    // ==================== 비밀번호 재설정 API ====================

    /**
     * 1. 비밀번호 찾기 - 이메일로 재설정 링크 전송
     * POST /api/auth/find-password
     */
    @PostMapping("/find-password")
    public ResponseEntity<Map<String, Object>> findPassword(
            @RequestBody Map<String, String> request) {

        try {
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "이메일을 입력해주세요.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            log.info("비밀번호 찾기 요청 - Email: {}", email);
            
            authService.sendPasswordResetEmail(email.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "비밀번호 재설정 링크가 이메일로 전송되었습니다.");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("비밀번호 찾기 실패", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            log.error("비밀번호 찾기 중 예상치 못한 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "비밀번호 찾기 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * 2. 토큰 유효성 검증
     * POST /api/auth/verify-reset-token
     */
    @PostMapping("/verify-reset-token")
    public ResponseEntity<Map<String, Object>> verifyResetToken(
            @RequestBody Map<String, String> request) {

        try {
            String token = request.get("token");
            
            if (token == null || token.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "토큰이 없습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            log.info("토큰 검증 요청");
            
            boolean isValid = authService.verifyResetToken(token.trim());

            if (!isValid) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "유효하지 않거나 만료된 토큰입니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "유효한 토큰입니다.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("토큰 검증 중 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "토큰 검증 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * 3. 비밀번호 재설정
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(
            @RequestBody Map<String, String> request) {

        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");
            
            if (token == null || token.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "토큰이 없습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            if (newPassword == null || newPassword.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "새 비밀번호를 입력해주세요.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // 비밀번호 강도 검증 (최소 8자, 영문+숫자)
            if (newPassword.length() < 8) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "비밀번호는 최소 8자 이상이어야 합니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            log.info("비밀번호 재설정 요청");
            
            authService.resetPassword(token.trim(), newPassword);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "비밀번호가 성공적으로 변경되었습니다.");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("비밀번호 재설정 실패", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
            
        } catch (Exception e) {
            log.error("비밀번호 재설정 중 예상치 못한 오류", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "비밀번호 재설정 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}