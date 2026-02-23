package com.aion.back.story.service;

import com.aion.back.story.dto.request.StoryCreateRequest;
import com.aion.back.story.dto.request.StoryUpdateRequest;
import com.aion.back.story.dto.response.StoryResponse;
import com.aion.back.story.entity.Story;
import com.aion.back.story.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;

    // 공개용: 섹션별로 그룹핑해서 반환
    @Transactional(readOnly = true)
    public Map<String, List<StoryResponse>> getPublishedStories() {
        List<Story> stories = storyRepository.findByIsPublishedTrueOrderBySectionTypeAscSortOrderAsc();
        return stories.stream()
                .map(StoryResponse::from)
                .collect(Collectors.groupingBy(StoryResponse::getSectionType));
    }

    // 관리자용: 전체 목록
    @Transactional(readOnly = true)
    public List<StoryResponse> getAllStories() {
        return storyRepository.findAllByOrderBySectionTypeAscSortOrderAsc()
                .stream()
                .map(StoryResponse::from)
                .collect(Collectors.toList());
    }

    // 단건 조회
    @Transactional(readOnly = true)
    public StoryResponse getStory(Long storyId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("스토리를 찾을 수 없습니다. id=" + storyId));
        return StoryResponse.from(story);
    }

    // 생성
    @Transactional
    public StoryResponse createStory(StoryCreateRequest request) {
        Story story = Story.builder()
                .sectionType(request.getSectionType())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .title(request.getTitle())
                .subtitle(request.getSubtitle())
                .content(request.getContent())
                .yearLabel(request.getYearLabel())
                .imageUrl(request.getImageUrl())
                .imagePosition(request.getImagePosition() != null ? request.getImagePosition() : "right")
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : true)
                .build();
        return StoryResponse.from(storyRepository.save(story));
    }

    // 수정
    @Transactional
    public StoryResponse updateStory(Long storyId, StoryUpdateRequest request) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("스토리를 찾을 수 없습니다. id=" + storyId));

        if (request.getSectionType() != null) story.setSectionType(request.getSectionType());
        if (request.getSortOrder() != null) story.setSortOrder(request.getSortOrder());
        if (request.getTitle() != null) story.setTitle(request.getTitle());
        if (request.getSubtitle() != null) story.setSubtitle(request.getSubtitle());
        if (request.getContent() != null) story.setContent(request.getContent());
        if (request.getYearLabel() != null) story.setYearLabel(request.getYearLabel());
        if (request.getImageUrl() != null) story.setImageUrl(request.getImageUrl());
        if (request.getImagePosition() != null) story.setImagePosition(request.getImagePosition());
        if (request.getIsPublished() != null) story.setIsPublished(request.getIsPublished());

        return StoryResponse.from(storyRepository.save(story));
    }

    // 삭제
    @Transactional
    public void deleteStory(Long storyId) {
        if (!storyRepository.existsById(storyId)) {
            throw new RuntimeException("스토리를 찾을 수 없습니다. id=" + storyId);
        }
        storyRepository.deleteById(storyId);
    }
}