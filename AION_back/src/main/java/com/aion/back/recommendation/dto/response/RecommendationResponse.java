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

    private Long id;

    private String name;

    private String nameEn;

    private String description;

    private Long brandId;

    private String brandName;

    private String brandNameEn;

    private Integer price;

    private Integer saleRate;

    private Integer salePrice;

    private Integer originalPrice;

    private Integer discountRate;

    private Integer volumeMl;

    private String concentration;

    private String gender;

    private String category;  

    private List<String> scentCategories;  

    private List<ScentNote> topNotes;

    private List<ScentNote> middleNotes;

    private List<ScentNote> baseNotes;

    private List<String> tags;

    private List<String> seasons;

    private List<String> occasions;

    private Double avgRating;

    private Integer reviewCount;

    private Integer rating;  

    private Integer salesCount;

    private Integer viewCount;

    private Integer wishlistCount;

    private Integer totalStock;

    private Boolean isActive;

    private LocalDateTime createdAt;

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
        private String noteType;  
    }
}