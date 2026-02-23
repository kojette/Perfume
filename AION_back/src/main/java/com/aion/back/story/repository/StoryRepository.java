package com.aion.back.story.repository;

import com.aion.back.story.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    List<Story> findByIsPublishedTrueOrderBySectionTypeAscSortOrderAsc();

    List<Story> findBySectionTypeAndIsPublishedTrueOrderBySortOrderAsc(String sectionType);

    List<Story> findAllByOrderBySectionTypeAscSortOrderAsc();
}