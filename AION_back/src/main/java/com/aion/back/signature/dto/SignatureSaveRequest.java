package com.aion.back.signature.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
public class SignatureSaveRequest {

    private String title;
    private String description;
    private String type;        // 기본값 'SIGNATURE' — 서비스에서 강제
    private String textColor;
    private Boolean isPublished;
    private Boolean isActive;
    private LocalDateTime visibleFrom;
    private LocalDateTime visibleUntil;

    private List<MediaItem> mediaList;
    private List<TextBlockItem> textBlocks;
    private List<PerfumeItem> perfumes;

    @Getter @Setter
    public static class MediaItem {
        private String mediaUrl;
        private String mediaType;   // IMAGE | GIF
        private Integer displayOrder;
    }

    @Getter @Setter
    public static class TextBlockItem {
        private String content;
        private String fontSize;    // small|medium|large|xlarge
        private String fontWeight;  // light|normal|medium|bold
        private Boolean isItalic;
        private String positionX;
        private String positionY;
        private Integer displayOrder;
    }

    @Getter @Setter
    public static class PerfumeItem {
        private Long perfumeId;
        private Integer displayOrder;
        private Boolean isFeatured;
    }
}
