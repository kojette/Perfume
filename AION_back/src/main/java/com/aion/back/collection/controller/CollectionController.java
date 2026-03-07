package com.aion.back.collection.controller;

import com.aion.back.collection.dto.response.PerfumeNotesResponse;
import com.aion.back.collection.service.CollectionService;
import com.aion.back.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 컬렉션(향수 라이브러리) API
 *
 * [노트 조회] — 인증 불필요, 공개 API
 *   GET /api/collections/perfumes/{perfumeId}/notes
 *     → 해당 향수의 Top / Middle / Base 노트 이름 목록 반환
 *
 * 인증 방식: CustomizationController / CartController 와 동일 패턴
 *   (본 엔드포인트는 공개이므로 토큰 불필요)
 */
@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CollectionController {

    private final CollectionService collectionService;

    /**
     * 향수 노트 조회 (Top / Middle / Base)
     * GET /api/collections/perfumes/{perfumeId}/notes
     *
     * @param perfumeId 향수 ID
     * @return top, middle, base 노트 이름 목록
     */
    @GetMapping("/perfumes/{perfumeId}/notes")
    public ApiResponse<PerfumeNotesResponse> getPerfumeNotes(
            @PathVariable Long perfumeId) {
        return ApiResponse.success(
                "노트 조회 성공",
                collectionService.getPerfumeNotes(perfumeId)
        );
    }
    @GetMapping("/active")
    public ApiResponse<?> getActiveCollections(
            @RequestParam String type) {

        return ApiResponse.success(
                "컬렉션 조회 성공",
                collectionService.getActiveCollection(type)
        );
    }
}