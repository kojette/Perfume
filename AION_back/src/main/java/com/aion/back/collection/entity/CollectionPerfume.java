package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "\"Collection_Perfumes\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionPerfume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "collection_id", nullable = false)
    private Long collectionId;

    @Column(name = "perfume_id", nullable = false)
    private Long perfumeId;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;
}