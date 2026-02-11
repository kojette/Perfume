package com.aion.back.perfume.repository;

import com.aion.back.perfume.entity.Perfume;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerfumeRepository extends JpaRepository<Perfume, Long> {

    // JpaRepository가 기본 제공하는 메서드들:
    // - findAll(Pageable pageable)
    // - findById(Long id)
    // - save(Perfume perfume)
    // - saveAll(List<Perfume> perfumes)
    // - deleteById(Long id)
    // - delete(Perfume perfume)
    // - findAllById(Iterable<Long> ids)

    /**
     * 향수 이름 찾기
     */
    List<Perfume> findByNameContainingIgnoreCase(String keyword);

    /**
     * 활성화된 향수만 조회
     */
    Page<Perfume> findByIsActiveTrue(Pageable pageable);

    /**
     * 브랜드별 향수 조회
     */
    Page<Perfume> findByBrandBrandId(Long brandId, Pageable pageable);

    /**
     * 활성화 여부로 조회
     */
    Page<Perfume> findByIsActive(Boolean isActive, Pageable pageable);

    /**
     * 향수 이름으로 검색
     */
    Page<Perfume> findByNameContainingOrNameEnContaining(
            String name, String nameEn, Pageable pageable);

    /**
     * 할인 중인 향수 조회
     */
    @Query("SELECT p FROM Perfume p WHERE p.saleRate > 0 AND p.isActive = true")
    List<Perfume> findSalePerfumes(Pageable pageable);

    /**
     * 재고 있는 향수 조회
     */
    @Query("SELECT p FROM Perfume p WHERE p.totalStock > 0 AND p.isActive = true")
    List<Perfume> findInStockPerfumes(Pageable pageable);

    /**
     * 향수 개수 조회
     */
    long count();

    /**
     * 특정 브랜드의 활성 향수 개수
     */
    long countByBrandBrandIdAndIsActive(Long brandId, Boolean isActive);
}