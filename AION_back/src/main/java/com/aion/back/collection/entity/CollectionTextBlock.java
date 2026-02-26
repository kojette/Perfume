package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "\"Collection_Text_Blocks\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionTextBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "text_block_id")
    @JdbcTypeCode(SqlTypes.BIGINT)
    private Long textBlockId;

    @Column(name = "collection_id", nullable = false, columnDefinition = "uuid")
    @JdbcTypeCode(SqlTypes.UUID)
    private UUID collectionId;

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
