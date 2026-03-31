package com.aion.back.perfume.repository;

import com.aion.back.perfume.entity.Perfume;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerfumeRepository extends JpaRepository<Perfume, Long> {

    List<Perfume> findByNameContainingIgnoreCase(String keyword);

    Page<Perfume> findByIsActiveTrue(Pageable pageable);

    Page<Perfume> findByBrandBrandId(Long brandId, Pageable pageable);

    Page<Perfume> findByIsActive(Boolean isActive, Pageable pageable);

    Page<Perfume> findByNameContainingOrNameEnContaining(
            String name, String nameEn, Pageable pageable);

    @Query("SELECT p FROM Perfume p WHERE p.saleRate > 0 AND p.isActive = true")
    List<Perfume> findSalePerfumes(Pageable pageable);

    @Query("SELECT p FROM Perfume p WHERE p.totalStock > 0 AND p.isActive = true")
    List<Perfume> findInStockPerfumes(Pageable pageable);

    long count();

    long countByBrandBrandIdAndIsActive(Long brandId, Boolean isActive);

    @Query(value = "SELECT p.perfume_id AS perfumeId, p.name AS name, p.price AS price, " +
            "b.brand_name AS brandName, pi.image_url AS imageUrl " +
            "FROM \"Perfumes\" p " +
            "LEFT JOIN \"Brands\" b ON p.brand_id = b.brand_id " +
            "LEFT JOIN \"Perfume_Images\" pi ON p.perfume_id = pi.perfume_id AND pi.is_thumbnail = true " +
            "WHERE p.name ILIKE CONCAT('%', :keyword, '%')", nativeQuery = true)
    List<PerfumeSearchProjection> searchWithImages(@Param("keyword") String keyword);
}