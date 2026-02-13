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

    @Column(name = "total_amount")
    private Integer totalAmount;

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
