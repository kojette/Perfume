package com.aion.back.story.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class StoryCreateRequest {

    private String sectionType;   // HISTORY | PROCESS | PHILOSOPHY
    private Integer sortOrder;
    private String title;
    private String subtitle;
    private String content;
    private String yearLabel;     // 히스토리용 연도 (ex: "1847")
    private String imageUrl;
    private String imagePosition; // left | right | background | top
    private Boolean isPublished;
}