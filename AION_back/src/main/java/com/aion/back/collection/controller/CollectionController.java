package com.aion.back.collection.controller;

import com.aion.back.collection.dto.CollectionDetailResponse;
import com.aion.back.collection.dto.CollectionSaveRequest;
import com.aion.back.collection.dto.CollectionSummaryResponse;
import com.aion.back.collection.service.CollectionService;
import com.aion.back.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CollectionController {

    private final CollectionService collectionService;

    // ===== 공개 API =====

    @GetMapping("/active")
    public ResponseEntity<?> getActive(@RequestParam String type) {
        try {
            CollectionDetailResponse data = collectionService.getActiveCollection(type);
            return ResponseEntity.ok(ApiResponse.success("컬렉션 조회 성공", data));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.success(e.getMessage(), null));
        }
    }

    // ===== 관리자 API =====

    @GetMapping
    public ApiResponse<List<CollectionSummaryResponse>> getList(
            @RequestHeader("Authorization") String token,
            @RequestParam String type) {
        return ApiResponse.success("목록 조회 성공", collectionService.getList(type));
    }

    @GetMapping("/{collectionId}")
    public ApiResponse<CollectionDetailResponse> getDetail(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID collectionId) {
        return ApiResponse.success("조회 성공", collectionService.getDetail(token, collectionId));
    }

    @PostMapping
    public ApiResponse<CollectionDetailResponse> create(
            @RequestHeader("Authorization") String token,
            @RequestBody CollectionSaveRequest request) {
        return ApiResponse.success("생성되었습니다.", collectionService.create(token, request));
    }

    @PutMapping("/{collectionId}")
    public ApiResponse<CollectionDetailResponse> update(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID collectionId,
            @RequestBody CollectionSaveRequest request) {
        return ApiResponse.success("저장되었습니다.", collectionService.update(token, collectionId, request));
    }

    @PatchMapping("/{collectionId}/active")
    public ApiResponse<Void> toggleActive(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID collectionId,
            @RequestParam boolean activate) {
        collectionService.toggleActive(token, collectionId, activate);
        return ApiResponse.success(activate ? "활성화되었습니다." : "비활성화되었습니다.");
    }

    @DeleteMapping("/{collectionId}")
    public ApiResponse<Void> delete(
            @RequestHeader("Authorization") String token,
            @PathVariable UUID collectionId) {
        collectionService.delete(token, collectionId);
        return ApiResponse.success("삭제되었습니다.");
    }
}