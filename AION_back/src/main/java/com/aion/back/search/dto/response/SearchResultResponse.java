package com.aion.back.search.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SearchResultResponse {
    private Long perfumeId;
    private String name;
    private Integer price;
    private String imageUrl;
    private String brandName;
}