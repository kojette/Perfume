package com.aion.back.collection.repository;

import com.aion.back.collection.entity.PerfumeNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerfumeNoteRepository extends JpaRepository<PerfumeNote, Long> {

    /** 특정 향수의 모든 노트 조회 */
    List<PerfumeNote> findByPerfumeId(Long perfumeId);
}
