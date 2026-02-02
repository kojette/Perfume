package com.aion.back.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPerfumeResponse {
    private Long perfumeId;
    private String name;
    private String nameEn;
    private Long brandId;
    private String brandName;
    private Integer price;
    private Integer saleRate;
    private Integer salePrice;
    private Integer volumeMl;
    private String concentration;
    private String gender;
    private Integer totalStock;
    private Boolean isActive;
    private LocalDate discontinuedDate;
    private LocalDate releaseDate;
    private Integer salesCount;
}