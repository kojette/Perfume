package com.aion.back.collection.repository;

import com.aion.back.collection.entity.CollectionMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectionMediaRepository extends JpaRepository<CollectionMedia, Long> {
    List<CollectionMedia> findByCollectionIdOrderByDisplayOrderAsc(Long collectionId);
    void deleteByCollectionId(Long collectionId);
}