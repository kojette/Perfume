package com.aion.back.perfume.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerfumeDetailResponse {
    private Long perfumeId;
    private String name;
    private String nameEn;
    private Long brandId;
    private String brandName;
    private String description;
    private Integer price;
    private Integer saleRate;
    private Integer salePrice;
    private Integer volumeMl;
    private String concentration;
    private String gender;
    private String targetAgeGroup;
    private List<String> season;
    private List<String> occasion;
    private String intensity;
    private Integer longevityHours;
    private String sillage;
    private Boolean isCustomizable;
    private Boolean isLimitedEdition;
    private LocalDate releaseDate;
    private Integer totalStock;
    private Integer salesCount;
    private Double avgRating;
    private Integer reviewCount;
    private Integer viewCount;
    private Integer wishlistCount;
    private List<String> imageUrls;
    private List<ScentResponse> notes;
    private List<TagResponse> tags;
    private Boolean isActive;
}