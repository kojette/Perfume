package com.aion.back.recommendation.service;

import com.aion.back.perfume.entity.Perfume;
import com.aion.back.perfume.repository.PerfumeRepository;
import com.aion.back.recommendation.dto.response.RecommendationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private final PerfumeRepository perfumeRepository;

    /**
     * 추천 향수 목록 조회 (필터링 + 정렬)
     */
    public Page<RecommendationResponse> getRecommendations(
            String search,
            List<String> tags,
            String gender,
            List<String> seasons,
            List<String> occasions,
            Integer minPrice,
            Integer maxPrice,
            Pageable pageable) {

        // 1. 활성화된 향수만 조회
        Page<Perfume> perfumes = perfumeRepository.findByIsActiveTrue(pageable);

        // 2. 필터링 적용
        List<Perfume> filteredPerfumes = perfumes.getContent().stream()
                .filter(perfume -> applyFilters(perfume, search, tags, gender, seasons, occasions, minPrice, maxPrice))
                .collect(Collectors.toList());

        // 3. DTO 변환
        List<RecommendationResponse> responses = filteredPerfumes.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, perfumes.getTotalElements());
    }

    /**
     * 필터 적용
     */
    private boolean applyFilters(
            Perfume perfume,
            String search,
            List<String> tags,
            String gender,
            List<String> seasons,
            List<String> occasions,
            Integer minPrice,
            Integer maxPrice) {

        // 검색어 필터
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            boolean matchesSearch = 
                (perfume.getName() != null && perfume.getName().toLowerCase().contains(searchLower)) ||
                (perfume.getNameEn() != null && perfume.getNameEn().toLowerCase().contains(searchLower)) ||
                (perfume.getBrand() != null && perfume.getBrand().getBrandName() != null && 
                 perfume.getBrand().getBrandName().toLowerCase().contains(searchLower));
            
            if (!matchesSearch) return false;
        }

        // 성별 필터
        if (gender != null && !gender.isEmpty()) {
            if (!gender.equalsIgnoreCase(perfume.getGender())) {
                return false;
            }
        }

        // 가격 필터
        Integer price = perfume.getSalePrice() != null ? perfume.getSalePrice() : perfume.getPrice();
        if (minPrice != null && price < minPrice) return false;
        if (maxPrice != null && price > maxPrice) return false;

        // 태그 필터 (추후 PerfumeTag 테이블 연동 시 구현)
        // 계절 필터 (추후 구현)
        // 용도 필터 (추후 구현)

        return true;
    }

    /**
     * Perfume Entity -> RecommendationResponse 변환
     */
    private RecommendationResponse convertToResponse(Perfume perfume) {
        Integer salePrice = perfume.getSalePrice() != null ? perfume.getSalePrice() : perfume.getPrice();
        Integer originalPrice = perfume.getSaleRate() != null && perfume.getSaleRate() > 0 ? perfume.getPrice() : null;

        return RecommendationResponse.builder()
                .id(perfume.getPerfumeId())
                .name(perfume.getName())
                .nameEn(perfume.getNameEn())
                .description(perfume.getDescription())
                .brandId(perfume.getBrand() != null ? perfume.getBrand().getBrandId() : null)
                .brandName(perfume.getBrand() != null ? perfume.getBrand().getBrandName() : null)
                .brandNameEn(perfume.getBrand() != null ? perfume.getBrand().getBrandNameEn() : null)
                .price(perfume.getPrice())
                .saleRate(perfume.getSaleRate())
                .salePrice(salePrice)
                .originalPrice(originalPrice)
                .discountRate(perfume.getSaleRate() != null ? perfume.getSaleRate() : 0)
                .volumeMl(perfume.getVolumeMl())
                .gender(perfume.getGender())
                .avgRating(perfume.getAvgRating())
                .reviewCount(perfume.getReviewCount())
                .rating(perfume.getAvgRating() != null ? (int) Math.round(perfume.getAvgRating()) : 0)
                .salesCount(perfume.getSalesCount())
                .viewCount(perfume.getViewCount())
                .wishlistCount(perfume.getWishlistCount())
                .totalStock(perfume.getTotalStock())
                .isActive(perfume.getIsActive())
                .createdAt(perfume.getCreatedAt())
                // 태그 및 향 정보는 추후 추가
                .tags(new ArrayList<>())
                .seasons(new ArrayList<>())
                .occasions(new ArrayList<>())
                .scentCategories(new ArrayList<>())
                .build();
    }

    /**
     * 특정 향수 추천 상세 정보
     */
    public RecommendationResponse getRecommendationDetail(Long perfumeId) {
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new RuntimeException("향수를 찾을 수 없습니다."));

        return convertToResponse(perfume);
    }

    /**
     * 카테고리별 추천
     */
    public List<RecommendationResponse> getRecommendationsByCategory(String category, int limit) {
        // 카테고리에 따른 필터링 로직
        List<Perfume> perfumes;

        switch (category.toUpperCase()) {
            case "MAN":
                perfumes = perfumeRepository.findByIsActiveTrue(
                    org.springframework.data.domain.PageRequest.of(0, limit)
                ).getContent()
                .stream()
                .filter(p -> "MALE".equalsIgnoreCase(p.getGender()))
                .collect(Collectors.toList());
                break;

            case "WOMAN":
                perfumes = perfumeRepository.findByIsActiveTrue(
                    org.springframework.data.domain.PageRequest.of(0, limit)
                ).getContent()
                .stream()
                .filter(p -> "FEMALE".equalsIgnoreCase(p.getGender()))
                .collect(Collectors.toList());
                break;

            default:
                perfumes = perfumeRepository.findByIsActiveTrue(
                    org.springframework.data.domain.PageRequest.of(0, limit)
                ).getContent();
                break;
        }

        return perfumes.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
}