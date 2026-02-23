package com.aion.back.story.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Stories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "story_id")
    private Long storyId;

    // HISTORY | PROCESS | PHILOSOPHY
    @Column(name = "section_type", nullable = false, length = 20)
    private String sectionType;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "subtitle", length = 300)
    private String subtitle;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    // 연도 (히스토리 섹션용, ex: "1847")
    @Column(name = "year_label", length = 10)
    private String yearLabel;

    // 이미지 URL
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // 이미지 위치: left | right | background | top
    @Column(name = "image_position", length = 20)
    private String imagePosition;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private Boolean isPublished = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}