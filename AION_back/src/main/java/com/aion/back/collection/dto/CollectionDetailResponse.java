package com.aion.back.collection.dto;

import com.aion.back.collection.entity.*;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class CollectionDetailResponse {

    private Long collectionId;
    private String title;
    private String description;
    private String type;
    private String textColor;
    private Boolean isPublished;
    private Boolean isActive;
    private LocalDateTime createdAt;

    private List<MediaDto> mediaList;
    private List<TextBlockDto> textBlocks;
    private List<PerfumeDto> perfumes;

    @Getter @Builder
    public static class MediaDto {
        private Long mediaId;
        private String mediaUrl;
        private String mediaType;
        private Integer displayOrder;

        public static MediaDto from(CollectionMedia m) {
            return MediaDto.builder()
                    .mediaId(m.getMediaId())
                    .mediaUrl(m.getMediaUrl())
                    .mediaType(m.getMediaType())
                    .displayOrder(m.getDisplayOrder())
                    .build();
        }
    }

    @Getter @Builder
    public static class TextBlockDto {
        private Long textBlockId;
        private String content;
        private String fontSize;
        private String fontWeight;
        private Boolean isItalic;
        private String positionX;
        private String positionY;
        private Integer displayOrder;

        public static TextBlockDto from(CollectionTextBlock t) {
            return TextBlockDto.builder()
                    .textBlockId(t.getTextBlockId())
                    .content(t.getContent())
                    .fontSize(t.getFontSize())
                    .fontWeight(t.getFontWeight())
                    .isItalic(t.getIsItalic())
                    .positionX(t.getPositionX())
                    .positionY(t.getPositionY())
                    .displayOrder(t.getDisplayOrder())
                    .build();
        }
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