package com.aion.back.collection.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Perfume_Notes 테이블 매핑
 * note_type: TOP / MIDDLE / BASE (PostgreSQL USER-DEFINED enum → String으로 읽기)
 */
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

    // PostgreSQL USER-DEFINED enum을 String으로 읽기
    @Column(name = "note_type", nullable = false, columnDefinition = "note_type_enum")
    private String noteType; // TOP | MIDDLE | BASE

    @Column(name = "intensity_percent", precision = 5, scale = 2)
    private BigDecimal intensityPercent;
}