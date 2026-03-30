package com.aion.back.auth.repository;

import com.aion.back.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDesc(Long userId);
    
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}