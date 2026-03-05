package com.aion.back.order.entity;

import com.aion.back.member.entity.Member;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;

import java.time.LocalDateTime;

@Entity
@Table(name = "\"Orders\"")
@DynamicInsert
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member member;

    @Column(name = "order_number", nullable = false)
    private String orderNumber;

    @org.hibernate.annotations.ColumnTransformer(write = "?::order_status_enum")
    @Column(name = "order_status")
    private String orderStatus;

    @org.hibernate.annotations.ColumnTransformer(write = "?::payment_method_enum")
    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    // 원래 금액 (쿠폰/포인트 적용 전)
    @Column(name = "total_amount")
    private Integer totalAmount;

    // 쿠폰 할인 금액 - DB 컬럼명: coupon_discount
    @Column(name = "coupon_discount", columnDefinition = "integer default 0")
    @Builder.Default
    private Integer discountAmount = 0;

    // 사용된 포인트 - DB 컬럼명: point_used (단수)
    @Column(name = "point_used", columnDefinition = "integer default 0")
    @Builder.Default
    private Integer pointsUsed = 0;

    // 최종 결제 금액 (totalAmount - discountAmount - pointsUsed)
    @Column(name = "final_amount")
    private Integer finalAmount;

    @Column(name = "receiver_name")
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false)
    private String receiverPhone;

    @Column(name = "shipping_zipcode", nullable = false)
    private String shippingZipcode;

    @Column(name = "shipping_address", columnDefinition = "TEXT", nullable = false)
    private String shippingAddress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @JsonManagedReference
    private java.util.List<OrderItem> orderItems;
}