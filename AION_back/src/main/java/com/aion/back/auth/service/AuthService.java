package com.aion.back.auth.service;

import com.aion.back.auth.dto.request.LoginRecordRequest;
import com.aion.back.auth.entity.PasswordResetToken;
import com.aion.back.auth.repository.PasswordResetTokenRepository;
import com.aion.back.common.config.SupabaseJwtValidator;
import com.aion.back.member.entity.Member;
import com.aion.back.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SupabaseJwtValidator jwtValidator;
    // private final LoginHistoryRepository loginHistoryRepository; // 나중에 추가

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private MemberRepository memberRepository; // 변수명도 memberRepository로 바꾸는 게 관례상 좋습니다.

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    // 프론트엔드 URL (application.properties에서 설정 가능)
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username}") // application.properties에서 아이디를 가져옴
    private String fromEmail;
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

            // 2. 유저 상태 확인 (방어 로직 추가)
            Member member = memberRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            if ("DELETED".equals(member.getAccountStatus())) {
                log.warn("탈퇴한 계정 접근 시도 - Email: {}", email);
                throw new RuntimeException("탈퇴 처리된 계정입니다. 접속할 수 없습니다.");
            }

            log.info("로그인 기록 저장 - Email: {}, Method: {}", email, request.getLoginMethod());

            // 3. 로그인 이력 저장 (LoginHistory 엔티티 생성 후 활성화)
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

        } catch (RuntimeException e) {
            throw e;
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

    // ==================== 비밀번호 재설정 기능 ====================

    /**
     * 비밀번호 찾기 - 이메일로 재설정 링크 전송
     * @param email 사용자 이메일
     */
    @Transactional
    public void sendPasswordResetEmail(String email) {
        log.info("비밀번호 재설정 요청 - Email: {}", email);

        // 이메일로 사용자 찾기
        Member user = memberRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 사용자가 없습니다."));

        // 토큰 생성 (UUID 사용)
        String token = UUID.randomUUID().toString();

        // 만료 시간 설정 (24시간 후)
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        // DB에 토큰 저장
        PasswordResetToken resetToken = new PasswordResetToken(user.getUserId(), token, expiresAt);
        passwordResetTokenRepository.save(resetToken);

        // 이메일 전송
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        sendEmail(user.getEmail(), 
                  "AION - 비밀번호 재설정 안내", 
                  "안녕하세요, AION입니다.\n\n" +
                  "비밀번호를 재설정하려면 아래 링크를 클릭하세요:\n\n" + 
                  resetLink + 
                  "\n\n이 링크는 24시간 동안 유효합니다.\n" +
                  "본인이 요청하지 않았다면 이 메일을 무시하세요.\n\n" +
                  "감사합니다.");

        log.info("비밀번호 재설정 이메일 전송 완료 - Email: {}", email);
    }

    /**
     * 토큰 검증
     * @param token 재설정 토큰
     * @return 토큰 유효 여부
     */
    public boolean verifyResetToken(String token) {
        log.info("토큰 검증 요청 - Token: {}", token);

        Optional<PasswordResetToken> resetToken = passwordResetTokenRepository.findByToken(token);

        if (resetToken.isEmpty()) {
            log.warn("토큰을 찾을 수 없음 - Token: {}", token);
            return false;
        }

        PasswordResetToken tokenEntity = resetToken.get();

        // 이미 사용된 토큰인지 확인
        if (tokenEntity.getUsed()) {
            log.warn("이미 사용된 토큰 - Token: {}", token);
            return false;
        }

        // 만료되었는지 확인
        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("만료된 토큰 - Token: {}", token);
            return false;
        }

        log.info("토큰 검증 성공 - Token: {}", token);
        return true;
    }

    /**
     * 비밀번호 재설정
     * @param token 재설정 토큰
     * @param newPassword 새 비밀번호
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("비밀번호 재설정 요청 - Token: {}", token);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
            .orElseThrow(() -> new RuntimeException("유효하지 않은 토큰입니다."));

        // 토큰 검증
        if (resetToken.getUsed()) {
            throw new RuntimeException("이미 사용된 토큰입니다.");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("만료된 토큰입니다.");
        }

        // 사용자 찾기
        Member user = memberRepository.findById(resetToken.getUserId())
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 비밀번호 암호화 후 변경
        user.setPassword(passwordEncoder.encode(newPassword));
        memberRepository.save(user);

        // 토큰을 사용됨으로 표시
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("비밀번호 재설정 완료 - UserId: {}", user.getUserId());
    }

    /**
     * 이메일 전송 헬퍼 메서드
     * @param to 수신자
     * @param subject 제목
     * @param text 내용
     */
    private void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            message.setFrom(fromEmail);  // 발신자 이메일 (application.properties에서 설정)

            mailSender.send(message);
            log.info("이메일 전송 성공 - To: {}", to);
        } catch (Exception e) {
            log.error("이메일 전송 실패 - To: {}", to, e);
            throw new RuntimeException("이메일 전송 중 오류가 발생했습니다.", e);
        }
    }
}