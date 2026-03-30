package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity(name = "CollectionPerfumeNote")
@Table(name = "\"Perfume_Notes\"")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerfumeNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    private Long noteId;

    @Column(name = "perfume_id", nullable = false)
    private Long perfumeId;

    @Column(name = "scent_id", nullable = false)
    private Long scentId;

    @Column(name = "note_type", nullable = false, columnDefinition = "note_type_enum")
    private String noteType; 

    @Column(name = "intensity_percent", precision = 5, scale = 2)
    private BigDecimal intensityPercent;
}