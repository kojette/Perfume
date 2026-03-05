package com.aion.back.customization.repository;

import com.aion.back.customization.entity.CustomBottle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomBottleRepository extends JpaRepository<CustomBottle, Long> {

    /** 활성화된 공병 목록만 조회 */
    List<CustomBottle> findByIsActiveTrueOrderByCreatedAtAsc();
}
