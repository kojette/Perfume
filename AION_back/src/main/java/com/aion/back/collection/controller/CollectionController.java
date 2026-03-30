package com.aion.back.collection.controller;

import com.aion.back.collection.dto.response.PerfumeNotesResponse;
import com.aion.back.collection.service.CollectionService;
import com.aion.back.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CollectionController {

    private final CollectionService collectionService;

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