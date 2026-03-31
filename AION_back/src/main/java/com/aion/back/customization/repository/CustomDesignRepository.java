package com.aion.back.customization.repository;

import com.aion.back.customization.entity.CustomDesign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomDesignRepository extends JpaRepository<CustomDesign, Long> {
    List<CustomDesign> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<CustomDesign> findByDesignIdAndUserId(Long designId, Long userId);
    long countByUserId(Long userId);
}