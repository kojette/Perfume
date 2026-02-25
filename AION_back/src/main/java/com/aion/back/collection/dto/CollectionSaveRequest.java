package com.aion.back.collection.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class CollectionSaveRequest {

    private String title;
    private String description;
    private String type;          // "COLLECTION" or "SIGNATURE"
    private String textColor;
    private Boolean isPublished;

    private List<MediaItem> mediaList;
    private List<TextBlockItem> textBlocks;
    private List<PerfumeItem> perfumes;

    @Getter @Setter
    public static class MediaItem {
        private String mediaUrl;
        private String mediaType;
        private Integer displayOrder;
    }

    @Getter @Setter
    public static class TextBlockItem {
        private String content;
        private String fontSize;
        private String fontWeight;
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