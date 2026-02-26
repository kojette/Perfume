package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "\"Collection_Perfumes\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionPerfume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    @JdbcTypeCode(SqlTypes.BIGINT)
    private Long id;

    @Column(name = "collection_id", nullable = false, columnDefinition = "uuid")
    @JdbcTypeCode(SqlTypes.UUID)
    private UUID collectionId;

    @Column(name = "perfume_id", nullable = false)
    @JdbcTypeCode(SqlTypes.BIGINT)
    private Long perfumeId;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;
}
