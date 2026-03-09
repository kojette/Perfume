package com.aion.back.cart.entity;

import com.aion.back.member.entity.Member;
import com.aion.back.perfume.entity.Perfume;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Carts\"")
@Getter @Setter
@NoArgsConstructor
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id")
    private Long cartId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id", nullable = true)
    private Perfume perfume;

    private int quantity;

    @Column(name = "item_type")
    private String itemType;

    @Column(name = "is_custom")
    private Boolean isCustom = false;

    @Column(name = "custom_design_id")
    private Long customDesignId;

    @Column(name = "custom_name")
    private String customName;

    @Column(name = "custom_price")
    private Integer customPrice;

    @Column(name = "custom_image_url", columnDefinition = "TEXT")
    private String customImageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist(){
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public Cart(Member member, Perfume perfume, int quantity){
        this.member = member;
        this.perfume = perfume;
        this.quantity = quantity;
        this.itemType = "PERFUME";
        this.isCustom = false;
    }

    @Builder(builderMethodName = "customBuilder")
    public Cart(Member member, int quantity, Long customDesignId,
                String customName, Integer customPrice, String customImageUrl) {
        this.member = member;
        this.quantity = quantity;
        this.itemType = "CUSTOM";
        this.isCustom = true;
        this.customDesignId = customDesignId;
        this.customName = customName;
        this.customPrice = customPrice;
        this.customImageUrl = customImageUrl;
    }
}