package com.aion.back.story.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class StoryUpdateRequest {

    private String sectionType;
    private Integer sortOrder;
    private String title;
    private String subtitle;
    private String content;
    private String yearLabel;
    private String imageUrl;
    private String imagePosition;
    private Boolean isPublished;
}