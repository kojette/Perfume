package com.aion.back.admin.service;

import com.aion.back.perfume.entity.Perfume;
import com.aion.back.perfume.repository.PerfumeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPerfumeService {

    private final PerfumeRepository perfumeRepository;

    /**
     * 관리자용 향수 목록 조회 (임시 간소화)
     */
    public Page<Perfume> getAllPerfumes(
            Long brandId,
            Boolean isActive,
            Boolean isDiscontinued,
            Pageable pageable
    ) {
        // TODO: 필터링 추가 필요
        log.info("관리자 향수 목록 조회 - brandId: {}, isActive: {}", brandId, isActive);
        return perfumeRepository.findAll(pageable);
    }

    /**
     * 향수 상세 조회
     */
    public Perfume getPerfumeById(Long perfumeId) {
        return perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new RuntimeException("향수를 찾을 수 없습니다."));
    }

    /**
     * 향수 등록 (임시 간소화)
     */
    @Transactional
    public Perfume createPerfume(Perfume perfume) {
        log.info("향수 등록: {}", perfume.getName());
        return perfumeRepository.save(perfume);
    }

    /**
     * 향수 수정 (임시 간소화)
     */
    @Transactional
    public Perfume updatePerfume(Long perfumeId, Perfume perfume) {
        Perfume existing = getPerfumeById(perfumeId);
        log.info("향수 수정: {}", perfumeId);

        // 기본 필드만 업데이트
        if (perfume.getName() != null) existing.setName(perfume.getName());
        if (perfume.getNameEn() != null) existing.setNameEn(perfume.getNameEn());
        if (perfume.getDescription() != null) existing.setDescription(perfume.getDescription());
        if (perfume.getPrice() != null) existing.setPrice(perfume.getPrice());
        if (perfume.getSaleRate() != null) existing.setSaleRate(perfume.getSaleRate());
        if (perfume.getTotalStock() != null) existing.setTotalStock(perfume.getTotalStock());

        return perfumeRepository.save(existing);
    }

    /**
     * 향수 삭제
     */
    @Transactional
    public void deletePerfume(Long perfumeId) {
        log.info("향수 삭제: {}", perfumeId);
        perfumeRepository.deleteById(perfumeId);
    }

    /**
     * 향수 단종 처리 (임시)
     */
    @Transactional
    public void discontinuePerfume(Long perfumeId, String reason) {
        Perfume perfume = getPerfumeById(perfumeId);
        perfume.setIsActive(false);
        perfumeRepository.save(perfume);
        log.info("향수 단종 처리: {} - 사유: {}", perfumeId, reason);
    }

    /**
     * 향수 복구
     */
    @Transactional
    public void restorePerfume(Long perfumeId) {
        Perfume perfume = getPerfumeById(perfumeId);
        perfume.setIsActive(true);
        perfumeRepository.save(perfume);
        log.info("향수 복구: {}", perfumeId);
    }

    /**
     * 재고 조정 (임시)
     */
    @Transactional
    public void adjustStock(Long perfumeId, Integer quantity, String reason) {
        Perfume perfume = getPerfumeById(perfumeId);
        Integer currentStock = perfume.getTotalStock() != null ? perfume.getTotalStock() : 0;
        perfume.setTotalStock(currentStock + quantity);
        perfumeRepository.save(perfume);
        log.info("재고 조정: {} - 수량: {} - 사유: {}", perfumeId, quantity, reason);
    }

    /**
     * 일괄 할인 적용 (임시)
     */
    @Transactional
    public void applyBulkDiscount(java.util.List<Long> perfumeIds, Integer discountRate) {
        if (discountRate < 0 || discountRate > 100) {
            throw new RuntimeException("할인율은 0~100 사이여야 합니다.");
        }

        java.util.List<Perfume> perfumes = perfumeRepository.findAllById(perfumeIds);

        for (Perfume perfume : perfumes) {
            perfume.setSaleRate(discountRate);
            if (perfume.getPrice() != null) {
                int salePrice = (int) (perfume.getPrice() * (1 - discountRate / 100.0));
                perfume.setSalePrice(salePrice);
            }
        }

        perfumeRepository.saveAll(perfumes);
        log.info("일괄 할인 적용: {} 개 상품 - 할인율: {}%", perfumeIds.size(), discountRate);
    }
}