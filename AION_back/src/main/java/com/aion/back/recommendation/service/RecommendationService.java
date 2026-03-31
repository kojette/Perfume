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

    private final com.aion.back.perfume.repository.PerfumeImageRepository perfumeImageRepository;

    public Page<RecommendationResponse> getRecommendations(
            String search,
            List<String> tags,
            String gender,
            List<String> seasons,
            List<String> occasions,
            Integer minPrice,
            Integer maxPrice,
            Pageable pageable) {
        Page<Perfume> perfumes = perfumeRepository.findByIsActiveTrue(pageable);
        List<Perfume> filteredPerfumes = perfumes.getContent().stream()
                .filter(perfume -> applyFilters(perfume, search, tags, gender, seasons, occasions, minPrice, maxPrice))
                .collect(Collectors.toList());
        List<RecommendationResponse> responses = filteredPerfumes.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(responses, pageable, perfumes.getTotalElements());
    }

    private boolean applyFilters(
            Perfume perfume,
            String search,
            List<String> tags,
            String gender,
            List<String> seasons,
            List<String> occasions,
            Integer minPrice,
            Integer maxPrice) {
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            boolean matchesSearch =
                (perfume.getName() != null && perfume.getName().toLowerCase().contains(searchLower)) ||
                (perfume.getNameEn() != null && perfume.getNameEn().toLowerCase().contains(searchLower)) ||
                (perfume.getBrand() != null && perfume.getBrand().getBrandName() != null &&
                 perfume.getBrand().getBrandName().toLowerCase().contains(searchLower));
            if (!matchesSearch) return false;
        }
        if (gender != null && !gender.isEmpty()) {
            if (!gender.equalsIgnoreCase(perfume.getGender())) {
                return false;
            }
        }
        Integer price = perfume.getSalePrice() != null ? perfume.getSalePrice() : perfume.getPrice();
        if (minPrice != null && price < minPrice) return false;
        if (maxPrice != null && price > maxPrice) return false;
        return true;
    }

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
                .imageUrl(perfumeImageRepository
                        .findByPerfumeAndIsThumbnailTrue(perfume)
                        .map(img -> img.getImageUrl())
                        .orElse(perfume.getImageUrl()))
                .tags(new ArrayList<>())
                .seasons(new ArrayList<>())
                .occasions(new ArrayList<>())
                .scentCategories(new ArrayList<>())
                .build();
    }

    public RecommendationResponse getRecommendationDetail(Long perfumeId) {
        Perfume perfume = perfumeRepository.findById(perfumeId)
                .orElseThrow(() -> new RuntimeException("향수를 찾을 수 없습니다."));
        return convertToResponse(perfume);
    }

    public List<RecommendationResponse> getRecommendationsByCategory(String category, int limit) {
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

    public List<RecommendationResponse> getRecommendationsByAge(String ageGroup, int limit) {
        List<String> keywords = switch (ageGroup.toLowerCase()) {
            case "10s" -> List.of("플로럴", "프루티", "청량한", "달콤한");
            case "20s" -> List.of("시트러스", "아쿠아틱", "머스크", "청량한");
            case "30s" -> List.of("우디", "앰버", "스파이시", "관능적인");
            case "40s" -> List.of("오리엔탈", "파우더리", "가죽", "클래식");
            case "50s" -> List.of("바닐라", "샌달우드", "로즈", "우아한");
            default    -> List.of();
        };
        List<Perfume> all = perfumeRepository.findByIsActiveTrue(
                org.springframework.data.domain.PageRequest.of(0, 200)
        ).getContent();
        List<Perfume> matched = all.stream()
                .filter(p -> matchesAgeKeywords(p, keywords))
                .limit(limit)
                .collect(Collectors.toList());
        List<Perfume> result = new ArrayList<>(matched);
        if (result.size() < limit) {
            List<Perfume> fallback = all.stream()
                    .filter(p -> !matched.contains(p))
                    .limit(limit - result.size())
                    .collect(Collectors.toList());
            result.addAll(fallback);
        }
        return result.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private boolean matchesAgeKeywords(Perfume perfume, List<String> keywords) {
        if (keywords.isEmpty()) return true;
        String haystack = String.join(" ",
                perfume.getName() != null ? perfume.getName() : "",
                perfume.getNameEn() != null ? perfume.getNameEn() : "",
                perfume.getDescription() != null ? perfume.getDescription() : ""
        ).toLowerCase();
        return keywords.stream().anyMatch(kw -> haystack.contains(kw.toLowerCase()));
    }
}