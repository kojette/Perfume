package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "\"Collections\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionEntity {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "collection_id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID collectionId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String type;

    @Column(name = "text_color")
    private String textColor;

    @Builder.Default
    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "visible_from")
    private LocalDateTime visibleFrom;

    @Column(name = "visible_until")
    private LocalDateTime visibleUntil;
}
