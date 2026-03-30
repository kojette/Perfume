package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity(name = "CollectionScent")
@Table(name = "\"Scents\"")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scent {

    @Id
    @Column(name = "scent_id")
    private Long scentId;

    @Column(name = "scent_name")
    private String scentName;
}