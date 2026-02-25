package com.aion.back.announcement.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class AnnouncementRequest {
    private String title;
    private String content;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isPinned = false;
    private Boolean isImportant = false;
    private Long linkedEventId;
}