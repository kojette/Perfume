package com.aion.back.collection.controller;

import com.aion.back.collection.dto.CollectionDetailResponse;
import com.aion.back.collection.dto.CollectionSaveRequest;
import com.aion.back.collection.dto.CollectionSummaryResponse;
import com.aion.back.collection.service.CollectionService;
import com.aion.back.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CollectionController {

    private final CollectionService collectionService;

    // ===== 공개 API =====

    // 활성화된 컬렉션 조회 (미디어+텍스트+향수 한 번에)
    @GetMapping("/active")
    public ApiResponse<CollectionDetailResponse> getActive(@RequestParam String type) {
        return ApiResponse.success("컬렉션 조회 성공", collectionService.getActiveCollection(type));
    }

    // ===== 관리자 API =====

    // 목록 조회
    @GetMapping
    public ApiResponse<List<CollectionSummaryResponse>> getList(
            @RequestHeader("Authorization") String token,
            @RequestParam String type) {
        return ApiResponse.success("목록 조회 성공", collectionService.getList(type));
    }

    // 단건 상세 조회 (편집용)
    @GetMapping("/{collectionId}")
    public ApiResponse<CollectionDetailResponse> getDetail(
            @RequestHeader("Authorization") String token,
            @PathVariable Long collectionId) {
        return ApiResponse.success("조회 성공", collectionService.getDetail(token, collectionId));
    }

    // 신규 생성
    @PostMapping
    public ApiResponse<CollectionDetailResponse> create(
            @RequestHeader("Authorization") String token,
            @RequestBody CollectionSaveRequest request) {
        return ApiResponse.success("생성되었습니다.", collectionService.create(token, request));
    }

    // 수정
    @PutMapping("/{collectionId}")
    public ApiResponse<CollectionDetailResponse> update(
            @RequestHeader("Authorization") String token,
            @PathVariable Long collectionId,
            @RequestBody CollectionSaveRequest request) {
        return ApiResponse.success("저장되었습니다.", collectionService.update(token, collectionId, request));
    }

    // 활성화/비활성화
    @PatchMapping("/{collectionId}/active")
    public ApiResponse<Void> toggleActive(
            @RequestHeader("Authorization") String token,
            @PathVariable Long collectionId,
            @RequestParam boolean activate) {
        collectionService.toggleActive(token, collectionId, activate);
        return ApiResponse.success(activate ? "활성화되었습니다." : "비활성화되었습니다.");
    }

    // 삭제
    @DeleteMapping("/{collectionId}")
    public ApiResponse<Void> delete(
            @RequestHeader("Authorization") String token,
            @PathVariable Long collectionId) {
        collectionService.delete(token, collectionId);
        return ApiResponse.success("삭제되었습니다.");
    }
}