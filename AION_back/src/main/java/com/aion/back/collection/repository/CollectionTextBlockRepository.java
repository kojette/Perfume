package com.aion.back.collection.repository;

import com.aion.back.collection.entity.CollectionTextBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionTextBlockRepository extends JpaRepository<CollectionTextBlock, Long> {

    @Query(value = "SELECT * FROM \"Collection_Text_Blocks\" WHERE collection_id = :collectionId ORDER BY display_order ASC", nativeQuery = true)
    List<CollectionTextBlock> findByCollectionIdOrderByDisplayOrderAsc(@Param("collectionId") UUID collectionId);

    @Modifying
    @Query(value = "DELETE FROM \"Collection_Text_Blocks\" WHERE collection_id = :collectionId", nativeQuery = true)
    void deleteByCollectionId(@Param("collectionId") UUID collectionId);

    @Modifying
    @Query(value = "INSERT INTO \"Collection_Text_Blocks\" (collection_id, content, font_size, font_weight, is_italic, position_x, position_y, display_order) VALUES (:collectionId, :content, :fontSize, :fontWeight, :isItalic, :positionX, :positionY, :displayOrder)", nativeQuery = true)
    void insertTextBlock(@Param("collectionId") UUID collectionId,
                         @Param("content") String content,
                         @Param("fontSize") String fontSize,
                         @Param("fontWeight") String fontWeight,
                         @Param("isItalic") Boolean isItalic,
                         @Param("positionX") String positionX,
                         @Param("positionY") String positionY,
                         @Param("displayOrder") Integer displayOrder);
}
