package com.aion.back.recommendation.controller;

import com.aion.back.recommendation.dto.response.RecommendationResponse;
import com.aion.back.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * 추천 향수 목록 조회 (필터링 + 정렬)
     * 
     * @param search 검색어 (향수명, 브랜드명)
     * @param tags 선호 태그 (쉼표로 구분: "플로럴,우디,청량한")
     * @param gender 성별 필터 (MALE, FEMALE, UNISEX)
     * @param season 계절 필터 (쉼표로 구분: "봄,여름")
     * @param occasion 용도 필터 (쉼표로 구분: "데이트,일상")
     * @param minPrice 최소 가격
     * @param maxPrice 최대 가격
     * @param sortBy 정렬 기준 (latest, price-low, price-high, rating, popular)
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 추천 향수 목록
     */
    @GetMapping
    public ResponseEntity<Page<RecommendationResponse>> getRecommendations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String season,
            @RequestParam(required = false) String occasion,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("추천 향수 조회 - search: {}, tags: {}, sortBy: {}", search, tags, sortBy);

        // 태그 파싱
        List<String> tagList = tags != null && !tags.isEmpty() 
            ? List.of(tags.split(","))
            : List.of();

        // 계절 파싱
        List<String> seasonList = season != null && !season.isEmpty()
            ? List.of(season.split(","))
            : List.of();

        // 용도 파싱
        List<String> occasionList = occasion != null && !occasion.isEmpty()
            ? List.of(occasion.split(","))
            : List.of();

        // 정렬 조건 생성
        Sort sort = createSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        // 추천 향수 조회
        Page<RecommendationResponse> recommendations = recommendationService.getRecommendations(
            search, tagList, gender, seasonList, occasionList, 
            minPrice, maxPrice, pageable
        );

        return ResponseEntity.ok(recommendations);
    }

    /*정렬 조건 생성*/
    private Sort createSort(String sortBy) {
        return switch (sortBy) {
            case "price-low" -> Sort.by("salePrice").ascending();
            case "price-high" -> Sort.by("salePrice").descending();
            case "rating" -> Sort.by("avgRating").descending();
            case "popular" -> Sort.by("salesCount").descending()
                    .and(Sort.by("wishlistCount").descending());
            case "latest" -> Sort.by("createdAt").descending();
            default -> Sort.by("createdAt").descending();
        };
    }

    /* 특정 향수 추천 상세 정보*/
    @GetMapping("/{perfumeId}")
    public ResponseEntity<RecommendationResponse> getRecommendationDetail(
            @PathVariable Long perfumeId) {
        
        RecommendationResponse recommendation = recommendationService.getRecommendationDetail(perfumeId);
        return ResponseEntity.ok(recommendation);
    }

    /**
     * 카테고리별 추천 (빠른 필터)
     * 
     * @param category 카테고리 (MAN, WOMAN, DATE, FRESH, SPRING, FALL)
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<RecommendationResponse>> getRecommendationsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "10") int limit) {

        log.info("카테고리별 추천 조회 - category: {}, limit: {}", category, limit);

        List<RecommendationResponse> recommendations = 
            recommendationService.getRecommendationsByCategory(category, limit);

        return ResponseEntity.ok(recommendations);
    }

    /**
     * 연령대별 추천 향수 조회
     *
     * 각 연령대에 어울리는 향 특성을 기반으로 추천합니다.
     *
     * @param ageGroup 연령대 코드 (10s, 20s, 30s, 40s, 50s)
     *   - 10s : 플로럴, 프루티, 청량한
     *   - 20s : 시트러스, 아쿠아틱, 머스크
     *   - 30s : 우디, 앰버, 스파이시
     *   - 40s : 오리엔탈, 파우더리, 가죽
     *   - 50s : 바닐라, 샌달우드, 로즈
     * @param limit  반환할 최대 개수 (기본 10)
     */
    @GetMapping("/age/{ageGroup}")
    public ResponseEntity<List<RecommendationResponse>> getRecommendationsByAge(
            @PathVariable String ageGroup,
            @RequestParam(defaultValue = "10") int limit) {

        log.info("연령대별 추천 조회 - ageGroup: {}, limit: {}", ageGroup, limit);

        List<RecommendationResponse> recommendations =
                recommendationService.getRecommendationsByAge(ageGroup, limit);

        return ResponseEntity.ok(recommendations);
    }
}