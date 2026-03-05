package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "\"Collection_Media\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    @JdbcTypeCode(SqlTypes.BIGINT)
    private Long mediaId;

    @Column(name = "collection_id", nullable = false, columnDefinition = "uuid")
    @JdbcTypeCode(SqlTypes.UUID)
    private UUID collectionId;

    @Column(name = "media_url", columnDefinition = "TEXT", nullable = false)
    private String mediaUrl;

    @Column(name = "media_type")
    private String mediaType;

    @Column(name = "display_order")
    private Integer displayOrder;
}
