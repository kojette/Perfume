package com.aion.back.collection.repository;

import com.aion.back.collection.entity.CollectionPerfume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionPerfumeRepository extends JpaRepository<CollectionPerfume, Long> {

    @Query(value = "SELECT * FROM \"Collection_Perfumes\" WHERE collection_id = :collectionId ORDER BY display_order ASC", nativeQuery = true)
    List<CollectionPerfume> findByCollectionIdOrderByDisplayOrderAsc(@Param("collectionId") UUID collectionId);

    @Modifying
    @Query(value = "DELETE FROM \"Collection_Perfumes\" WHERE collection_id = :collectionId", nativeQuery = true)
    void deleteByCollectionId(@Param("collectionId") UUID collectionId);

    @Modifying
    @Query(value = "INSERT INTO \"Collection_Perfumes\" (collection_id, perfume_id, display_order, is_featured) VALUES (:collectionId, :perfumeId, :displayOrder, :isFeatured)", nativeQuery = true)
    void insertPerfume(@Param("collectionId") UUID collectionId,
                       @Param("perfumeId") Long perfumeId,
                       @Param("displayOrder") Integer displayOrder,
                       @Param("isFeatured") Boolean isFeatured);
}
