package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "\"Collection_Text_Blocks\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionTextBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "text_block_id")
    private Long textBlockId;

    @Column(name = "collection_id", nullable = false)
    private Long collectionId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "font_size")
    private String fontSize;

    @Column(name = "font_weight")
    private String fontWeight;

    @Column(name = "is_italic")
    private Boolean isItalic = false;

    @Column(name = "position_x")
    private String positionX;

    @Column(name = "position_y")
    private String positionY;

    @Column(name = "display_order")
    private Integer displayOrder;
}