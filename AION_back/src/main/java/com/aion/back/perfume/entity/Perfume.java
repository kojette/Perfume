package com.aion.back.perfume.entity;

import com.aion.back.brand.entity.Brand;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;


import java.time.LocalDateTime;

@Entity
@Table(name = "\"Perfumes\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Perfume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "perfume_id")
    private Long perfumeId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price")
    private Integer price;

    @Column(name = "sale_rate")
    private Integer saleRate;

    @Column(name = "sale_price", insertable = false, updatable = false)
    private Integer salePrice;

    @Column(name = "volume_ml")
    private Integer volumeMl;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "total_stock")
    private Integer totalStock;

    @Column(name = "sales_count")
    private Integer salesCount;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "wishlist_count")
    private Integer wishlistCount;

    @Column(name = "avg_rating")
    private Double avgRating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @Column(name = "is_active")
    private Boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 비즈니스 메서드
    public void incrementViewCount() {

        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }

    public void incrementSalesCount() {

        this.salesCount = (this.salesCount == null ? 0 : this.salesCount) + 1;
    }

    public void incrementWishlistCount() {
        this.wishlistCount = (this.wishlistCount == null ? 0 : this.wishlistCount) + 1;
    }

    public void decrementWishlistCount() {
        if (this.wishlistCount != null && this.wishlistCount > 0) {
            this.wishlistCount--;
        }
    }
}