package com.aion.back.collection.dto;

import com.aion.back.collection.entity.*;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class CollectionDetailResponse {

    private UUID collectionId;
    private String title;
    private String description;
    private String type;
    private String textColor;
    private Boolean isPublished;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime visibleFrom;
    private LocalDateTime visibleUntil;

    private List<MediaDto> mediaList;
    private List<TextBlockDto> textBlocks;
    private List<PerfumeDto> perfumes;

    @Getter @Builder
    public static class MediaDto {
        private UUID mediaId;       // uuid
        private String mediaUrl;
        private String mediaType;
        private Integer displayOrder;
    }

    @Getter @Builder
    public static class TextBlockDto {
        private UUID textBlockId;   // uuid
        private String content;
        private String fontSize;
        private String fontWeight;
        private Boolean isItalic;
        private String positionX;
        private String positionY;
        private Integer displayOrder;
    }

    @Getter @Builder
    public static class PerfumeDto {
        private Long perfumeId;
        private String name;
        private String nameEn;
        private Integer price;
        private Integer salePrice;
        private Integer saleRate;
        private String brandName;
        private String thumbnail;
        private Integer displayOrder;
        private Boolean isFeatured;
    }
}
