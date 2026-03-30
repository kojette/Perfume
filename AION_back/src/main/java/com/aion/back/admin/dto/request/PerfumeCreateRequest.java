package com.aion.back.admin.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerfumeCreateRequest {
    
    @NotNull(message = "브랜드 ID는 필수입니다")
    private Long brandId;
    
    @NotBlank(message = "향수 이름은 필수입니다")
    private String name;
    
    private String nameEn;
    private String description;
    
    @NotNull(message = "가격은 필수입니다")
    @Positive(message = "가격은 0보다 커야 합니다")
    private Integer price;
    
    @NotNull(message = "원가는 필수입니다")
    @Positive(message = "원가는 0보다 커야 합니다")
    private Integer cost;
    
    private Integer saleRate; 
    
    @NotNull(message = "용량은 필수입니다")
    @Positive(message = "용량은 0보다 커야 합니다")
    private Integer volumeMl;
    
    @NotNull(message = "농도는 필수입니다")
    private String concentration; 
    
    @NotNull(message = "성별은 필수입니다")
    private String gender; 
    
    private String targetAgeGroup; 
    private List<String> season;
    private List<String> occasion;
    private String intensity; 
    private Integer longevityHours;
    private String sillage; 
    private Boolean isCustomizable;
    private Boolean isLimitedEdition;
    private Integer initialStock;
    
    private List<String> imageUrls;
    private List<NoteRequest> notes;
    private List<Long> tagIds;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NoteRequest {
        @NotNull
        private Long scentId;
        
        @NotNull
        private String noteType; 
        
        @NotNull
        @Positive
        private Integer intensity; 
    }
}