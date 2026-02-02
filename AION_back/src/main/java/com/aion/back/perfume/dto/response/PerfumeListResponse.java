package com.aion.back.perfume.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerfumeListResponse {
    private Long perfumeId;
    private String name;
    private String nameEn;
    private String brandName;
    private Integer price;
    private Integer saleRate;
    private Integer salePrice;
    private Integer volumeMl;
    private String concentration;
    private String gender;
    private String thumbnailUrl;
    private Double avgRating;
    private Integer reviewCount;
    private List<String> tags;
    private Boolean isActive;
}
