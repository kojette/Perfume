package com.aion.back.customization.repository;

import com.aion.back.customization.entity.CustomScentBlend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomScentBlendRepository extends JpaRepository<CustomScentBlend, Long> {

    List<CustomScentBlend> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT b FROM CustomScentBlend b LEFT JOIN FETCH b.items WHERE b.blendId = :blendId AND b.userId = :userId")
    Optional<CustomScentBlend> findByBlendIdAndUserIdWithItems(@Param("blendId") Long blendId, @Param("userId") Long userId);

    boolean existsByBlendIdAndUserId(Long blendId, Long userId);
}
