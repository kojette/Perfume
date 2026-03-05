package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 유저가 저장한 커스텀 향수 공병 디자인 엔티티
 */
@Entity
@Table(name = "\"Custom_Designs\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomDesign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "design_id")
    private Long designId;

    // Users 테이블의 user_id (FK)
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    // DEFAULT_BOTTLES.id 또는 Custom_Bottles.bottle_id를 문자열로 저장
    @Column(name = "bottle_key", nullable = false, length = 100)
    private String bottleKey;

    @Column(name = "bottle_color", length = 20)
    private String bottleColor;

    // NULL이면 각인 없음
    @Column(name = "engraving_text", length = 20)
    private String engravingText;

    // [{id, type, src|text, x, y, w, h}] JSON 직렬화 문자열
    @Column(name = "objects_json", columnDefinition = "TEXT")
    private String objectsJson;

    // 캔버스 toDataURL base64 또는 Supabase Storage URL
    @Column(name = "preview_image_url", columnDefinition = "TEXT")
    private String previewImageUrl;

    // 가격 항목별
    @Column(name = "bottle_price")
    private Integer bottlePrice;

    @Column(name = "printing_price")
    private Integer printingPrice;

    @Column(name = "sticker_price")
    private Integer stickerPrice;

    @Column(name = "engraving_price")
    private Integer engravingPrice;

    @Column(name = "total_price")
    private Integer totalPrice;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
