package com.aion.back.collection.dto;

import com.aion.back.collection.entity.CollectionEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CollectionSummaryResponse {
    private Long collectionId;
    private String title;
    private String description;
    private String type;
    private Boolean isPublished;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static CollectionSummaryResponse from(CollectionEntity c) {
        return CollectionSummaryResponse.builder()
                .collectionId(c.getCollectionId())
                .title(c.getTitle())
                .description(c.getDescription())
                .type(c.getType())
                .isPublished(c.getIsPublished())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}