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
        List<String> tagList = tags != null && !tags.isEmpty() 
            ? List.of(tags.split(","))
            : List.of();
        List<String> seasonList = season != null && !season.isEmpty()
            ? List.of(season.split(","))
            : List.of();
        List<String> occasionList = occasion != null && !occasion.isEmpty()
            ? List.of(occasion.split(","))
            : List.of();
        Sort sort = createSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<RecommendationResponse> recommendations = recommendationService.getRecommendations(
            search, tagList, gender, seasonList, occasionList, 
            minPrice, maxPrice, pageable
        );
        return ResponseEntity.ok(recommendations);
    }

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

    @GetMapping("/{perfumeId}")

    public ResponseEntity<RecommendationResponse> getRecommendationDetail(
            @PathVariable Long perfumeId) {
        RecommendationResponse recommendation = recommendationService.getRecommendationDetail(perfumeId);
        return ResponseEntity.ok(recommendation);
    }

    @GetMapping("/category/{category}")

    public ResponseEntity<List<RecommendationResponse>> getRecommendationsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("카테고리별 추천 조회 - category: {}, limit: {}", category, limit);
        List<RecommendationResponse> recommendations = 
            recommendationService.getRecommendationsByCategory(category, limit);
        return ResponseEntity.ok(recommendations);
    }

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