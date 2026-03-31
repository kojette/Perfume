package com.aion.back.perfume.repository;

import com.aion.back.perfume.entity.PerfumeImage;
import com.aion.back.perfume.entity.Perfume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerfumeImageRepository extends JpaRepository<PerfumeImage, Long> {
    Optional<PerfumeImage> findByPerfumeAndIsThumbnailTrue(Perfume perfume);
    List<PerfumeImage> findByPerfumeOrderByDisplayOrder(Perfume perfume);
}