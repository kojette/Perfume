package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "\"Collection_Media\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    private Long mediaId;

    @Column(name = "collection_id", nullable = false)
    private Long collectionId;

    @Column(name = "media_url", columnDefinition = "TEXT", nullable = false)
    private String mediaUrl;

    @Column(name = "media_type")
    private String mediaType; // "IMAGE" or "GIF"

    @Column(name = "display_order")
    private Integer displayOrder;
}