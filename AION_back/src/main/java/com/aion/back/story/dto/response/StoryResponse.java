package com.aion.back.story.dto.response;

import com.aion.back.story.entity.Story;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class StoryResponse {

    private Long storyId;
    private String sectionType;
    private Integer sortOrder;
    private String title;
    private String subtitle;
    private String content;
    private String yearLabel;
    private String imageUrl;
    private String imagePosition;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static StoryResponse from(Story story) {
        return StoryResponse.builder()
                .storyId(story.getStoryId())
                .sectionType(story.getSectionType())
                .sortOrder(story.getSortOrder())
                .title(story.getTitle())
                .subtitle(story.getSubtitle())
                .content(story.getContent())
                .yearLabel(story.getYearLabel())
                .imageUrl(story.getImageUrl())
                .imagePosition(story.getImagePosition())
                .isPublished(story.getIsPublished())
                .createdAt(story.getCreatedAt())
                .updatedAt(story.getUpdatedAt())
                .build();
    }
}