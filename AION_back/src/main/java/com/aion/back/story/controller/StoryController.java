package com.aion.back.story.controller;

import com.aion.back.story.dto.request.StoryCreateRequest;
import com.aion.back.story.dto.request.StoryUpdateRequest;
import com.aion.back.story.dto.response.StoryResponse;
import com.aion.back.story.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StoryController {

    private final StoryService storyService;

    // 공개 - 섹션별 그룹핑 반환
    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublishedStories() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", storyService.getPublishedStories());
        return ResponseEntity.ok(response);
    }

    // 관리자 - 전체 목록
    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAllStories() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", storyService.getAllStories());
        return ResponseEntity.ok(response);
    }

    // 단건 조회
    @GetMapping("/{storyId}")
    public ResponseEntity<Map<String, Object>> getStory(@PathVariable Long storyId) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", storyService.getStory(storyId));
        return ResponseEntity.ok(response);
    }

    // 생성 (관리자)
    @PostMapping
    public ResponseEntity<Map<String, Object>> createStory(@RequestBody StoryCreateRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", storyService.createStory(request));
        response.put("message", "스토리가 생성되었습니다.");
        return ResponseEntity.ok(response);
    }

    // 수정 (관리자)
    @PutMapping("/{storyId}")
    public ResponseEntity<Map<String, Object>> updateStory(
            @PathVariable Long storyId,
            @RequestBody StoryUpdateRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", storyService.updateStory(storyId, request));
        response.put("message", "스토리가 수정되었습니다.");
        return ResponseEntity.ok(response);
    }

    // 삭제 (관리자)
    @DeleteMapping("/{storyId}")
    public ResponseEntity<Map<String, Object>> deleteStory(@PathVariable Long storyId) {
        storyService.deleteStory(storyId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "스토리가 삭제되었습니다.");
        return ResponseEntity.ok(response);
    }
}