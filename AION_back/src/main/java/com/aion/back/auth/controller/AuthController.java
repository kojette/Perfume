package com.aion.back.auth.controller;

import com.aion.back.auth.dto.request.LoginRecordRequest;
import com.aion.back.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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
}