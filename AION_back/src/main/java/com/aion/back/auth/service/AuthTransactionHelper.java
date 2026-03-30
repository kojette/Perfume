package com.aion.back.auth.service;

import com.aion.back.auth.entity.PasswordResetToken;
import com.aion.back.auth.repository.PasswordResetTokenRepository;
import com.aion.back.member.entity.Member;
import com.aion.back.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthTransactionHelper {

    private final MemberRepository memberRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PasswordResetToken saveResetToken(String email) {
        Member user = memberRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 사용자가 없습니다."));

        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        PasswordResetToken resetToken = new PasswordResetToken(user.getUserId(), token, expiresAt);
        PasswordResetToken saved = passwordResetTokenRepository.save(resetToken);
        log.info("리셋 토큰 저장 완료 - UserID: {}", user.getUserId());
        return saved;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updatePassword(PasswordResetToken resetToken, String encodedPassword,
                               MemberRepository memberRepo,
                               PasswordResetTokenRepository tokenRepo) {
        int updatedRows = memberRepo.updatePassword(resetToken.getUserId(), encodedPassword);
        log.info("비밀번호 업데이트 결과 - 영향받은 행: {}", updatedRows);

        if (updatedRows == 1) {
            resetToken.setUsed(true);
            tokenRepo.save(resetToken);
            log.info("비밀번호 재설정 성공 - UserID: {}", resetToken.getUserId());
        } else {
            throw new RuntimeException("DB 업데이트에 실패했습니다. 사용자 ID를 확인하세요.");
        }
    }
}