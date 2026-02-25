package com.aion.back.collection.repository;

import com.aion.back.collection.entity.CollectionTextBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectionTextBlockRepository extends JpaRepository<CollectionTextBlock, Long> {
    List<CollectionTextBlock> findByCollectionIdOrderByDisplayOrderAsc(Long collectionId);
    void deleteByCollectionId(Long collectionId);
}