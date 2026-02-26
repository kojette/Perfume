package com.aion.back.collection.repository;

import com.aion.back.collection.entity.CollectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollectionRepository extends JpaRepository<CollectionEntity, UUID> {

    @Query(value = "SELECT * FROM \"Collections\" WHERE type = :type ORDER BY created_at DESC", nativeQuery = true)
    List<CollectionEntity> findByTypeOrderByCreatedAtDesc(@Param("type") String type);

    @Query(value = "SELECT * FROM \"Collections\" WHERE type = :type AND is_active = true LIMIT 1", nativeQuery = true)
    Optional<CollectionEntity> findByTypeAndIsActiveTrue(@Param("type") String type);

    @Query(value = "SELECT * FROM \"Collections\" WHERE collection_id = :id::uuid", nativeQuery = true)
    Optional<CollectionEntity> findByCollectionId(@Param("id") String id);

    @Query(value = "SELECT COUNT(*) FROM \"Collections\" WHERE collection_id = :id::uuid", nativeQuery = true)
    int countByCollectionId(@Param("id") String id);
}