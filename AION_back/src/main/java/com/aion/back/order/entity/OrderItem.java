package com.aion.back.order.entity;

import com.aion.back.perfume.entity.Perfume;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "\"Order_Items\"")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Long orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id")
    private Perfume perfume;

    @Column(name = "perfume_name_snapshot")
    private String perfumeNameSnapshot;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "volume_ml", nullable = false)
    private Integer volumeMl;

    @Column(name = "unit_price")
    private Integer unitPrice;

    @Column(name = "final_price")
    private Integer finalPrice;

}
