package com.aion.back.perfume.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScentResponse {
    private Long scentId;
    private String scentName;
    private String category;
    private String noteType; // TOP, MIDDLE, BASE
    private Integer intensity;
}
