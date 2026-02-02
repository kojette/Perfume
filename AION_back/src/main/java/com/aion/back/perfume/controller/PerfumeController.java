package com.aion.back.perfume.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.perfume.dto.response.PerfumeListResponse;
import com.aion.back.perfume.dto.response.PerfumeDetailResponse;
import com.aion.back.perfume.service.PerfumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/perfumes")
@RequiredArgsConstructor
public class PerfumeController {

    private final PerfumeService perfumeService;

    /**
     * 향수 목록 조회 (페이징, 필터링)
     * GET /api/perfumes?page=0&size=20&brand=1&gender=MALE&minPrice=0&maxPrice=500000
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PerfumeListResponse>>> getPerfumes(
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) List<Long> tagIds,
            Pageable pageable
    ) {
        Page<PerfumeListResponse> perfumes = perfumeService.getPerfumes(
                brandId, gender, minPrice, maxPrice, category, tagIds, pageable
        );
        return ResponseEntity.ok(ApiResponse.success("향수 목록 조회 성공", perfumes));
    }

    /**
     * 향수 상세 조회
     * GET /api/perfumes/{perfumeId}
     */
    @GetMapping("/{perfumeId}")
    public ResponseEntity<ApiResponse<PerfumeDetailResponse>> getPerfumeDetail(
            @PathVariable Long perfumeId
    ) {
        PerfumeDetailResponse perfume = perfumeService.getPerfumeDetail(perfumeId);
        return ResponseEntity.ok(ApiResponse.success("향수 상세 조회 성공", perfume));
    }

    /**
     * 신상품 조회
     * GET /api/perfumes/new
     */
    @GetMapping("/new")
    public ResponseEntity<ApiResponse<List<PerfumeListResponse>>> getNewPerfumes(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<PerfumeListResponse> perfumes = perfumeService.getNewPerfumes(limit);
        return ResponseEntity.ok(ApiResponse.success("신상품 조회 성공", perfumes));
    }

    /**
     * 베스트셀러 조회
     * GET /api/perfumes/best
     */
    @GetMapping("/best")
    public ResponseEntity<ApiResponse<List<PerfumeListResponse>>> getBestSellers(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<PerfumeListResponse> perfumes = perfumeService.getBestSellers(limit);
        return ResponseEntity.ok(ApiResponse.success("베스트셀러 조회 성공", perfumes));
    }

    /**
     * 할인 상품 조회
     * GET /api/perfumes/sale
     */
    @GetMapping("/sale")
    public ResponseEntity<ApiResponse<List<PerfumeListResponse>>> getSalePerfumes(
            Pageable pageable
    ) {
        List<PerfumeListResponse> perfumes = perfumeService.getSalePerfumes(pageable);
        return ResponseEntity.ok(ApiResponse.success("할인 상품 조회 성공", perfumes));
    }
}