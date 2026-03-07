package com.aion.back.collection.repository;

import com.aion.back.collection.entity.Scent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScentRepository extends JpaRepository<Scent, Long> {

    /** 향 ID 목록으로 조회 */
    List<Scent> findByScentIdIn(List<Long> scentIds);
}
