package com.aion.back.collection.repository;

import com.aion.back.collection.entity.CollectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<CollectionEntity, Long> {
    List<CollectionEntity> findByTypeOrderByCreatedAtDesc(String type);
    Optional<CollectionEntity> findByTypeAndIsActiveTrue(String type);
}