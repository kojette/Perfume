package com.aion.back.announcement.dto;

import com.aion.back.announcement.entity.Announcement;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class AnnouncementResponse {
    private Long id;
    private String title;
    private String content;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isPinned;
    private Boolean isImportant;
    private Long linkedEventId;
    private LocalDateTime createdAt;

    public static AnnouncementResponse from(Announcement a) {
        return AnnouncementResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .isPinned(a.getIsPinned())
                .isImportant(a.getIsImportant())
                .linkedEventId(a.getLinkedEventId())
                .createdAt(a.getCreatedAt())
                .build();
    }
}