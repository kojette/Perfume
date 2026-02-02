package com.aion.back.auth.service;

import com.aion.back.auth.dto.request.LoginRecordRequest;
import com.aion.back.common.config.SupabaseJwtValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SupabaseJwtValidator jwtValidator;
    // private final LoginHistoryRepository loginHistoryRepository; // 나중에 추가

    /**
     * 로그인 이력 저장
     * @param token JWT 토큰
     * @param request 로그인 정보
     */
    @Transactional
    public void recordLoginHistory(String token, LoginRecordRequest request) {
        try {
            // 1. JWT 토큰 검증 및 이메일 추출
            String email = jwtValidator.validateAndGetEmail(token);

            log.info("로그인 기록 저장 - Email: {}, Method: {}", email, request.getLoginMethod());

            // 2. 로그인 이력 저장 (LoginHistory 엔티티 생성 후 활성화)
            /*
            LoginHistory history = LoginHistory.builder()
                    .email(email)
                    .loginMethod(request.getLoginMethod())
                    .loginTime(LocalDateTime.now())
                    .ipAddress(request.getIpAddress())
                    .userAgent(request.getUserAgent())
                    .build();

            loginHistoryRepository.save(history);
            */

            // 임시: 로그만 출력
            log.info("로그인 성공 - IP: {}, UserAgent: {}",
                    request.getIpAddress(), request.getUserAgent());

        } catch (Exception e) {
            log.error("로그인 기록 저장 실패", e);
            throw new RuntimeException("로그인 기록 저장 중 오류 발생", e);
        }
    }

    /**
     * 토큰 검증
     * @param token JWT 토큰
     * @return 이메일
     */
    public String verifyToken(String token) {
        return jwtValidator.validateAndGetEmail(token);
    }
}