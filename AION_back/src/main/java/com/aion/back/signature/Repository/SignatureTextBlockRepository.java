package com.aion.back.signature.repository;

import com.aion.back.signature.entity.SignatureTextBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SignatureTextBlockRepository extends JpaRepository<SignatureTextBlock, Long> {

    @Query(value = "SELECT * FROM \"Collection_Text_Blocks\" WHERE collection_id = :collectionId::uuid ORDER BY display_order ASC", nativeQuery = true)
    List<SignatureTextBlock> findByCollectionIdOrderByDisplayOrderAsc(@Param("collectionId") UUID collectionId);

    @Modifying
    @Query(value = "DELETE FROM \"Collection_Text_Blocks\" WHERE collection_id = :collectionId::uuid", nativeQuery = true)
    void deleteByCollectionId(@Param("collectionId") UUID collectionId);
}
