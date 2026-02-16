package com.aion.back.recommendation.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationResponse {

    // 기본 정보
    private Long id;
    private String name;
    private String nameEn;
    private String description;

    // 브랜드 정보
    private Long brandId;
    private String brandName;
    private String brandNameEn;

    // 가격 정보
    private Integer price;
    private Integer saleRate;
    private Integer salePrice;
    private Integer originalPrice;
    private Integer discountRate;

    // 향수 속성
    private Integer volumeMl;
    private String concentration;
    private String gender;
    
    // 향 정보
    private String category; // 향 카테고리 (예: "플로럴 & 우디")
    private List<String> scentCategories; // 세부 향 카테고리들
    private List<ScentNote> topNotes;
    private List<ScentNote> middleNotes;
    private List<ScentNote> baseNotes;

    // 태그 및 분류
    private List<String> tags;
    private List<String> seasons;
    private List<String> occasions;

    // 평가 정보
    private Double avgRating;
    private Integer reviewCount;
    private Integer rating; // 정수형 평점 (0-5)

    // 통계 정보
    private Integer salesCount;
    private Integer viewCount;
    private Integer wishlistCount;
    private Integer totalStock;

    // 상태
    private Boolean isActive;
    private LocalDateTime createdAt;

    // 이미지 URL (추후 추가)
    private String imageUrl;
    private List<String> imageUrls;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScentNote {
        private String scentName;
        private String scentCategory;
        private String noteType; // TOP, MIDDLE, BASE
    }
}