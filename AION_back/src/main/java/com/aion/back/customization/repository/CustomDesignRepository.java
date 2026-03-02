package com.aion.back.customization.repository;

import com.aion.back.customization.entity.CustomDesign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomDesignRepository extends JpaRepository<CustomDesign, Long> {

    /** 특정 유저의 디자인 목록 (최신순) */
    List<CustomDesign> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** 특정 유저의 특정 디자인 조회 (소유권 검증용) */
    Optional<CustomDesign> findByDesignIdAndUserId(Long designId, Long userId);

    /** 특정 유저의 디자인 개수 */
    long countByUserId(Long userId);
}
