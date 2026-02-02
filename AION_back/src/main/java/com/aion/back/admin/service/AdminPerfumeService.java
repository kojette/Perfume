package com.aion.back.admin.service;

import com.aion.back.admin.dto.request.PerfumeCreateRequest;
import com.aion.back.admin.dto.request.PerfumeUpdateRequest;
import com.aion.back.admin.dto.response.AdminPerfumeResponse;
import com.aion.back.admin.entity.StockLog;
import com.aion.back.admin.repository.StockLogRepository;
import com.aion.back.brand.entity.Brand;
import com.aion.back.brand.repository.BrandRepository;
import com.aion.back.common.exception.BadRequestException;
import com.aion.back.common.exception.ResourceNotFoundException;
import com.aion.back.perfume.entity.*;
import com.aion.back.perfume.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPerfumeService {

    private final PerfumeRepository perfumeRepository;
    private final BrandRepository brandRepository;
    private final PerfumeImageRepository perfumeImageRepository;
    private final PerfumeNoteRepository perfumeNoteRepository;
    private final PerfumeTagRepository perfumeTagRepository;
    private final ScentRepository scentRepository;
    private final PreferenceTagRepository preferenceTagRepository;
    private final StockLogRepository stockLogRepository;

    /**
     * 관리자용 향수 목록 조회
     */
    public Page<AdminPerfumeResponse> getAllPerfumes(
            Long brandId,
            Boolean isActive,
            Boolean isDiscontinued,
            Pageable pageable
    ) {
        Page<Perfume> perfumes = perfumeRepository.findAllForAdmin(
                brandId, isActive, isDiscontinued, pageable
        );

        return perfumes.map(this::toAdminResponse);
    }

    /**
     * 향수 등록
     */
    @Transactional
    public AdminPerfumeResponse createPerfume(PerfumeCreateRequest request) {
        // 브랜드 확인
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("브랜드를 찾을 수 없습니다."));

        // 향수 생성
        Perfume perfume = Perfume.builder()
                .brand(brand)
                .name(request.getName())
                .nameEn(request.getNameEn())
                .description(request.getDescription())
                .price(request.getPrice())
                .cost(request.getCost())
                .saleRate(request.getSaleRate() != null ? request.getSaleRate() : 0)
                .salePrice(calculateSalePrice(request.getPrice(), request.getSaleRate()))
                .volumeMl(request.getVolumeMl())
                .concentration(request.getConcentration())
                .gender(request.getGender())
                .targetAgeGroup(request.getTargetAgeGroup())
                .season(request.getSeason())
                .occasion(request.getOccasion())
                .intensity(request.getIntensity())
                .longevityHours(request.getLongevityHours())
                .sillage(request.getSillage())
                .isCustomizable(request.getIsCustomizable() != null ? request.getIsCustomizable() : false)
                .isLimitedEdition(request.getIsLimitedEdition() != null ? request.getIsLimitedEdition() : false)
                .releaseDate(LocalDate.now())
                .totalStock(request.getInitialStock() != null ? request.getInitialStock() : 0)
                .isActive(true)
                .build();

        perfume = perfumeRepository.save(perfume);

        // 이미지 저장
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            saveImages(perfume, request.getImageUrls());
        }

        // 노트 저장
        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            saveNotes(perfume, request.getNotes());
        }

        // 태그 저장
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            saveTags(perfume, request.getTagIds());
        }

        // 재고 로그 기록
        if (request.getInitialStock() != null && request.getInitialStock() > 0) {
            logStockChange(perfume, request.getInitialStock(), "초기 재고 등록");
        }

        return toAdminResponse(perfume);
    }

    /**
     * 향수 수정
     */
    @Transactional
    public AdminPerfumeResponse updatePerfume(Long perfumeId, PerfumeUpdateRequest request) {
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new ResourceNotFoundException("향수를 찾을 수 없습니다."));

        // 기본 정보 수정
        if (request.getName() != null) perfume.setName(request.getName());
        if (request.getNameEn() != null) perfume.setNameEn(request.getNameEn());
        if (request.getDescription() != null) perfume.setDescription(request.getDescription());
        
        if (request.getPrice() != null) {
            perfume.setPrice(request.getPrice());
            perfume.setSalePrice(calculateSalePrice(request.getPrice(), perfume.getSaleRate()));
        }
        
        if (request.getSaleRate() != null) {
            perfume.setSaleRate(request.getSaleRate());
            perfume.setSalePrice(calculateSalePrice(perfume.getPrice(), request.getSaleRate()));
        }

        if (request.getVolumeMl() != null) perfume.setVolumeMl(request.getVolumeMl());
        if (request.getConcentration() != null) perfume.setConcentration(request.getConcentration());
        if (request.getGender() != null) perfume.setGender(request.getGender());
        if (request.getTotalStock() != null) {
            int diff = request.getTotalStock() - perfume.getTotalStock();
            perfume.setTotalStock(request.getTotalStock());
            if (diff != 0) {
                logStockChange(perfume, diff, "재고 수정");
            }
        }

        // 이미지 수정
        if (request.getImageUrls() != null) {
            perfumeImageRepository.deleteByPerfume(perfume);
            saveImages(perfume, request.getImageUrls());
        }

        // 노트 수정
        if (request.getNotes() != null) {
            perfumeNoteRepository.deleteByPerfume(perfume);
            saveNotes(perfume, request.getNotes());
        }

        // 태그 수정
        if (request.getTagIds() != null) {
            perfumeTagRepository.deleteByPerfume(perfume);
            saveTags(perfume, request.getTagIds());
        }

        perfume = perfumeRepository.save(perfume);
        return toAdminResponse(perfume);
    }

    /**
     * 향수 삭제
     */
    @Transactional
    public void deletePerfume(Long perfumeId) {
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new ResourceNotFoundException("향수를 찾을 수 없습니다."));

        // 관련 데이터 삭제
        perfumeImageRepository.deleteByPerfume(perfume);
        perfumeNoteRepository.deleteByPerfume(perfume);
        perfumeTagRepository.deleteByPerfume(perfume);

        // 향수 삭제
        perfumeRepository.delete(perfume);
    }

    /**
     * 향수 단종 처리
     */
    @Transactional
    public void discontinuePerfume(Long perfumeId, String reason) {
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new ResourceNotFoundException("향수를 찾을 수 없습니다."));

        perfume.setDiscontinuedDate(LocalDate.now());
        perfume.setIsActive(false);
        perfumeRepository.save(perfume);

        // Perfume_Renewals 테이블에 기록 (선택사항)
        // perfumeRenewalRepository.save(...)
    }

    /**
     * 향수 복구
     */
    @Transactional
    public void restorePerfume(Long perfumeId) {
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new ResourceNotFoundException("향수를 찾을 수 없습니다."));

        perfume.setDiscontinuedDate(null);
        perfume.setIsActive(true);
        perfumeRepository.save(perfume);
    }

    /**
     * 재고 조정
     */
    @Transactional
    public void adjustStock(Long perfumeId, Integer quantity, String reason) {
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new ResourceNotFoundException("향수를 찾을 수 없습니다."));

        perfume.setTotalStock(perfume.getTotalStock() + quantity);
        perfumeRepository.save(perfume);

        logStockChange(perfume, quantity, reason);
    }

    /**
     * 일괄 할인 적용
     */
    @Transactional
    public void applyBulkDiscount(List<Long> perfumeIds, Integer discountRate) {
        if (discountRate < 0 || discountRate > 100) {
            throw new BadRequestException("할인율은 0~100 사이여야 합니다.");
        }

        List<Perfume> perfumes = perfumeRepository.findAllById(perfumeIds);
        
        for (Perfume perfume : perfumes) {
            perfume.setSaleRate(discountRate);
            perfume.setSalePrice(calculateSalePrice(perfume.getPrice(), discountRate));
        }

        perfumeRepository.saveAll(perfumes);
    }

    // ========== Helper Methods ==========

    private Integer calculateSalePrice(Integer price, Integer saleRate) {
        if (saleRate == null || saleRate == 0) {
            return price;
        }
        return (int) (price * (1 - saleRate / 100.0));
    }

    private void saveImages(Perfume perfume, List<String> imageUrls) {
        for (int i = 0; i < imageUrls.size(); i++) {
            PerfumeImage image = PerfumeImage.builder()
                    .perfume(perfume)
                    .imageUrl(imageUrls.get(i))
                    .imageType(i == 0 ? "MAIN" : "SUB")
                    .isThumbnail(i == 0)
                    .displayOrder(i)
                    .build();
            perfumeImageRepository.save(image);
        }
    }

    private void saveNotes(Perfume perfume, List<PerfumeCreateRequest.NoteRequest> notes) {
        for (PerfumeCreateRequest.NoteRequest noteReq : notes) {
            Scent scent = scentRepository.findById(noteReq.getScentId())
                    .orElseThrow(() -> new ResourceNotFoundException("향 노트를 찾을 수 없습니다."));

            PerfumeNote note = PerfumeNote.builder()
                    .perfume(perfume)
                    .scent(scent)
                    .noteType(noteReq.getNoteType())
                    .intensityPercent(noteReq.getIntensity())
                    .build();
            perfumeNoteRepository.save(note);
        }
    }

    private void saveTags(Perfume perfume, List<Long> tagIds) {
        for (Long tagId : tagIds) {
            PreferenceTag tag = preferenceTagRepository.findById(tagId)
                    .orElseThrow(() -> new ResourceNotFoundException("태그를 찾을 수 없습니다."));

            PerfumeTag perfumeTag = PerfumeTag.builder()
                    .perfume(perfume)
                    .tag(tag)
                    .relevanceScore(50) // 기본값
                    .build();
            perfumeTagRepository.save(perfumeTag);
        }
    }

    private void logStockChange(Perfume perfume, Integer quantity, String reason) {
        StockLog log = StockLog.builder()
                .perfumeId(perfume.getPerfumeId())
                .changeType(quantity > 0 ? "IN" : "OUT")
                .quantity(Math.abs(quantity))
                .reason(reason)
                .build();
        stockLogRepository.save(log);
    }

    private AdminPerfumeResponse toAdminResponse(Perfume perfume) {
        return AdminPerfumeResponse.builder()
                .perfumeId(perfume.getPerfumeId())
                .name(perfume.getName())
                .nameEn(perfume.getNameEn())
                .brandId(perfume.getBrand().getBrandId())
                .brandName(perfume.getBrand().getBrandName())
                .price(perfume.getPrice())
                .saleRate(perfume.getSaleRate())
                .salePrice(perfume.getSalePrice())
                .volumeMl(perfume.getVolumeMl())
                .concentration(perfume.getConcentration().name())
                .gender(perfume.getGender().name())
                .totalStock(perfume.getTotalStock())
                .isActive(perfume.getIsActive())
                .discontinuedDate(perfume.getDiscontinuedDate())
                .releaseDate(perfume.getReleaseDate())
                .salesCount(perfume.getSalesCount())
                .build();
    }
}