package com.aion.back.collection.dto;

import com.aion.back.collection.entity.CollectionEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class CollectionSummaryResponse {
    private UUID collectionId;   // UUID
    private String title;
    private String description;
    private String type;
    private Boolean isPublished;
    private Boolean isActive;
    private LocalDateTime visibleFrom;
    private LocalDateTime visibleUntil;
    private LocalDateTime createdAt;

    public static CollectionSummaryResponse from(CollectionEntity c) {
        return CollectionSummaryResponse.builder()
                .collectionId(c.getCollectionId())
                .title(c.getTitle())
                .description(c.getDescription())
                .type(c.getType())
                .isPublished(c.getIsPublished())
                .isActive(c.getIsActive())
                .visibleFrom(c.getVisibleFrom())
                .visibleUntil(c.getVisibleUntil())
                .createdAt(c.getCreatedAt())
                .build();
    }
}