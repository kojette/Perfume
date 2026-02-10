package com.aion.back.auth.service;

import com.aion.back.auth.dto.request.LoginRecordRequest;
import com.aion.back.auth.entity.PasswordResetToken;
import com.aion.back.auth.repository.PasswordResetTokenRepository;
import com.aion.back.common.config.SupabaseJwtValidator;
import com.aion.back.member.entity.Member;
import com.aion.back.member.entity.AccountStatus;
import com.aion.back.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SupabaseJwtValidator jwtValidator;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    
    // 트랜잭션 분리를 위한 별도 빈 주입
    private final AuthTransactionHelper authTransactionHelper;

    @Transactional
    public void recordLoginHistory(String token, LoginRecordRequest request) {
        try {
            String email = jwtValidator.validateAndGetEmail(token);
            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            if (member.getAccountStatus() == AccountStatus.DELETED) {
                log.warn("탈퇴한 계정 접근 시도 - Email: {}", email);
                throw new RuntimeException("탈퇴 처리된 계정입니다. 접속할 수 없습니다.");
            }
            log.info("로그인 성공 - Email: {}", email);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("로그인 기록 저장 실패", e);
            throw new RuntimeException("로그인 기록 저장 중 오류 발생", e);
        }
    }

    public String verifyToken(String token) {
        return jwtValidator.validateAndGetEmail(token);
    }

    /**
     * 이제 비밀번호 재설정은 Supabase가 모두 처리
     * 프론트엔드에서 supabase.auth.resetPasswordForEmail() 호출 시 Supabase가 직접 메일 발송
     * 이 메서드는 더 이상 사용되지 않지만, 기존 코드 호환을 위해 남김
     */
    @Deprecated
    public void sendPasswordResetEmail(String email) {
        log.warn("❌ sendPasswordResetEmail() 호출됨 - 이제 Supabase가 메일을 직접 보냅니다!");
        log.info("프론트엔드에서 supabase.auth.resetPasswordForEmail()을 사용하세요.");
    }

    public boolean verifyResetToken(String token) {
        return passwordResetTokenRepository.findByToken(token)
                .map(t -> !t.getUsed() && t.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    /**
     * 이제 비밀번호 변경은 Supabase가 모두 처리
     * 프론트엔드에서 supabase.auth.updateUser({ password }) 호출 시 Supabase가 직접 처리
     * 이 메서드는 더 이상 사용되지 않지만, 기존 코드 호환을 위해 남김
     */
    @Deprecated
    public void resetPassword(String token, String newPassword) {
        log.warn("❌ resetPassword() 호출됨 - 이제 Supabase가 비밀번호 변경을 직접 처리합니다!");
        log.info("프론트엔드에서 supabase.auth.updateUser()를 사용하세요.");
    }
}