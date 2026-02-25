package com.aion.back.collection.repository;

import com.aion.back.collection.entity.CollectionPerfume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectionPerfumeRepository extends JpaRepository<CollectionPerfume, Long> {
    List<CollectionPerfume> findByCollectionIdOrderByDisplayOrderAsc(Long collectionId);
    void deleteByCollectionId(Long collectionId);
}