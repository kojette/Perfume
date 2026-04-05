package com.aion.back.signature.dto;

import com.aion.back.signature.entity.SignatureEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class SignatureSummaryResponse {

    private UUID collectionId;
    private String title;
    private String description;
    private String type;
    private Boolean isPublished;
    private Boolean isActive;
    private LocalDateTime visibleFrom;
    private LocalDateTime visibleUntil;
    private LocalDateTime createdAt;

    public static SignatureSummaryResponse from(SignatureEntity e) {
        return SignatureSummaryResponse.builder()
                .collectionId(e.getCollectionId())
                .title(e.getTitle())
                .description(e.getDescription())
                .type(e.getType())
                .isPublished(e.getIsPublished())
                .isActive(e.getIsActive())
                .visibleFrom(e.getVisibleFrom())
                .visibleUntil(e.getVisibleUntil())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
