package com.aion.back.perfume.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TagResponse {
    private Long tagId;
    private String tagName;
    private String tagType; // MOOD, OCCASION, FEATURE
}
