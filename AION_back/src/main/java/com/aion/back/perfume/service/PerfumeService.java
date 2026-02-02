package com.aion.back.perfume.service;

import com.aion.back.common.exception.ResourceNotFoundException;
import com.aion.back.perfume.dto.response.PerfumeDetailResponse;
import com.aion.back.perfume.dto.response.PerfumeListResponse;
import com.aion.back.perfume.dto.response.ScentResponse;
import com.aion.back.perfume.dto.response.TagResponse;
import com.aion.back.perfume.entity.*;
import com.aion.back.perfume.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PerfumeService {

    private final PerfumeRepository perfumeRepository;
    private final PerfumeImageRepository perfumeImageRepository;
    private final PerfumeNoteRepository perfumeNoteRepository;
    private final PerfumeTagRepository perfumeTagRepository;

    /**
     * 향수 목록 조회 (필터링, 페이징)
     */
    public Page<PerfumeListResponse> getPerfumes(
            Long brandId,
            String gender,
            Integer minPrice,
            Integer maxPrice,
            String category,
            List<Long> tagIds,
            Pageable pageable
    ) {
        // 동적 쿼리 빌더 사용 또는 QueryDSL 활용
        // 여기서는 간단한 예시로 Repository 메서드 활용
        Page<Perfume> perfumes = perfumeRepository.findAllWithFilters(
                brandId, gender, minPrice, maxPrice, category, tagIds, pageable
        );

        return perfumes.map(this::toPerfumeListResponse);
    }

    /**
     * 향수 상세 조회
     */
    public PerfumeDetailResponse getPerfumeDetail(Long perfumeId) {
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new ResourceNotFoundException("향수를 찾을 수 없습니다."));

        // 조회수 증가
        perfumeRepository.incrementViewCount(perfumeId);

        return toPerfumeDetailResponse(perfume);
    }

    /**
     * 신상품 조회 (최근 30일 이내 출시)
     */
    public List<PerfumeListResponse> getNewPerfumes(int limit) {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "releaseDate"));
        
        List<Perfume> perfumes = perfumeRepository.findByReleaseDateAfterAndIsActiveTrue(
                thirtyDaysAgo, pageable
        );

        return perfumes.stream()
                .map(this::toPerfumeListResponse)
                .collect(Collectors.toList());
    }

    /**
     * 베스트셀러 조회
     */
    public List<PerfumeListResponse> getBestSellers(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "salesCount"));
        
        List<Perfume> perfumes = perfumeRepository.findByIsActiveTrue(pageable);

        return perfumes.stream()
                .map(this::toPerfumeListResponse)
                .collect(Collectors.toList());
    }

    /**
     * 할인 상품 조회
     */
    public List<PerfumeListResponse> getSalePerfumes(Pageable pageable) {
        List<Perfume> perfumes = perfumeRepository.findBySaleRateGreaterThanAndIsActiveTrue(0, pageable);

        return perfumes.stream()
                .map(this::toPerfumeListResponse)
                .collect(Collectors.toList());
    }

    /**
     * Entity -> DTO 변환 (목록용)
     */
    private PerfumeListResponse toPerfumeListResponse(Perfume perfume) {
        String thumbnailUrl = perfumeImageRepository
                .findByPerfumeAndIsThumbnailTrue(perfume)
                .map(PerfumeImage::getImageUrl)
                .orElse(null);

        List<String> tags = perfumeTagRepository
                .findByPerfume(perfume)
                .stream()
                .map(pt -> pt.getTag().getTagName())
                .collect(Collectors.toList());

        return PerfumeListResponse.builder()
                .perfumeId(perfume.getPerfumeId())
                .name(perfume.getName())
                .nameEn(perfume.getNameEn())
                .brandName(perfume.getBrand().getBrandName())
                .price(perfume.getPrice())
                .saleRate(perfume.getSaleRate())
                .salePrice(perfume.getSalePrice())
                .volumeMl(perfume.getVolumeMl())
                .concentration(perfume.getConcentration().name())
                .gender(perfume.getGender().name())
                .thumbnailUrl(thumbnailUrl)
                .avgRating(perfume.getAvgRating())
                .reviewCount(perfume.getReviewCount())
                .tags(tags)
                .isActive(perfume.getIsActive())
                .build();
    }

    /**
     * Entity -> DTO 변환 (상세용)
     */
    private PerfumeDetailResponse toPerfumeDetailResponse(Perfume perfume) {
        List<String> imageUrls = perfumeImageRepository
                .findByPerfumeOrderByDisplayOrder(perfume)
                .stream()
                .map(PerfumeImage::getImageUrl)
                .collect(Collectors.toList());

        List<ScentResponse> notes = perfumeNoteRepository
                .findByPerfume(perfume)
                .stream()
                .map(note -> ScentResponse.builder()
                        .scentId(note.getScent().getScentId())
                        .scentName(note.getScent().getScentName())
                        .category(note.getScent().getScentCategory())
                        .noteType(note.getNoteType().name())
                        .intensity(note.getIntensityPercent())
                        .build())
                .collect(Collectors.toList());

        List<TagResponse> tags = perfumeTagRepository
                .findByPerfume(perfume)
                .stream()
                .map(pt -> TagResponse.builder()
                        .tagId(pt.getTag().getTagId())
                        .tagName(pt.getTag().getTagName())
                        .tagType(pt.getTag().getTagType().name())
                        .build())
                .collect(Collectors.toList());

        return PerfumeDetailResponse.builder()
                .perfumeId(perfume.getPerfumeId())
                .name(perfume.getName())
                .nameEn(perfume.getNameEn())
                .brandId(perfume.getBrand().getBrandId())
                .brandName(perfume.getBrand().getBrandName())
                .description(perfume.getDescription())
                .price(perfume.getPrice())
                .saleRate(perfume.getSaleRate())
                .salePrice(perfume.getSalePrice())
                .volumeMl(perfume.getVolumeMl())
                .concentration(perfume.getConcentration().name())
                .gender(perfume.getGender().name())
                .targetAgeGroup(perfume.getTargetAgeGroup().name())
                .season(perfume.getSeason())
                .occasion(perfume.getOccasion())
                .intensity(perfume.getIntensity().name())
                .longevityHours(perfume.getLongevityHours())
                .sillage(perfume.getSillage().name())
                .isCustomizable(perfume.getIsCustomizable())
                .isLimitedEdition(perfume.getIsLimitedEdition())
                .releaseDate(perfume.getReleaseDate())
                .totalStock(perfume.getTotalStock())
                .salesCount(perfume.getSalesCount())
                .avgRating(perfume.getAvgRating())
                .reviewCount(perfume.getReviewCount())
                .viewCount(perfume.getViewCount())
                .wishlistCount(perfume.getWishlistCount())
                .imageUrls(imageUrls)
                .notes(notes)
                .tags(tags)
                .isActive(perfume.getIsActive())
                .build();
    }
}