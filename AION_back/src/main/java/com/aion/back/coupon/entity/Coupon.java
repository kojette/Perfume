package com.aion.back.coupon.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Coupons\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Coupon {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(name = "discount_type", nullable = false)
    private String discountType;

    @Column(name = "discount_value", nullable = false)
    private Integer discountValue;

    @Column(name = "min_purchase")
    private Integer minPurchase;

    @Column(name = "max_discount")
    private Integer maxDiscount;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "is_stackable")
    private Boolean isStackable;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}