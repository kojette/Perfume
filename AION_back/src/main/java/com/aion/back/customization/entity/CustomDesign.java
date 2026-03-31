package com.aion.back.customization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

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

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "bottle_key", nullable = false, length = 100)
    private String bottleKey;

    @Column(name = "bottle_color", length = 20)
    private String bottleColor;

    @Column(name = "engraving_text", length = 20)
    private String engravingText;

    @Column(name = "objects_json", columnDefinition = "TEXT")
    private String objectsJson;

    @Column(name = "preview_image_url", columnDefinition = "TEXT")
    private String previewImageUrl;

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