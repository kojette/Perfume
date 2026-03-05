package com.aion.back.collection.repository;

import com.aion.back.collection.entity.CollectionMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionMediaRepository extends JpaRepository<CollectionMedia, Long> {

    @Query(value = "SELECT * FROM \"Collection_Media\" WHERE collection_id = :collectionId::uuid ORDER BY display_order ASC", nativeQuery = true)
    List<CollectionMedia> findByCollectionIdOrderByDisplayOrderAsc(@Param("collectionId") UUID collectionId);

    @Modifying
    @Query(value = "DELETE FROM \"Collection_Media\" WHERE collection_id = :collectionId::uuid", nativeQuery = true)
    void deleteByCollectionId(@Param("collectionId") UUID collectionId);

    @Modifying
    @Query(value = "INSERT INTO \"Collection_Media\" (collection_id, media_url, media_type, display_order) VALUES (:collectionId::uuid, :mediaUrl, :mediaType, :displayOrder)", nativeQuery = true)
    void insertMedia(@Param("collectionId") UUID collectionId,
                     @Param("mediaUrl") String mediaUrl,
                     @Param("mediaType") String mediaType,
                     @Param("displayOrder") Integer displayOrder);
}
