package com.aion.back.auth.repository;

import com.aion.back.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    // 토큰으로 찾기
    Optional<PasswordResetToken> findByToken(String token);
    
    // 사용자 ID로 찾기 (최신순)
    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    
    // 만료된 토큰 삭제 (선택사항 - 나중에 스케줄러로 실행)
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}