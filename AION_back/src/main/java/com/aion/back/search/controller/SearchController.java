package com.aion.back.search.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.perfume.entity.Perfume;
import com.aion.back.perfume.repository.PerfumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SearchController {

    private final PerfumeRepository perfumeRepository;

    @GetMapping("/functions")
    public ApiResponse<?> searchPerfumes(@RequestParam("keyword") String keyword) {

        List<Perfume> searchResults = perfumeRepository.findByNameContainingIgnoreCase(keyword);

        // DTO로 변환해서 반환
        List<PerfumeSearchDTO> dtoList = searchResults.stream()
                .map(perfume -> PerfumeSearchDTO.builder()
                        .perfumeId(perfume.getPerfumeId())
                        .name(perfume.getName())
                        .price(perfume.getPrice())
                        .imageUrl(null) // 이미지 필드명 확인 필요
                        .brandName(perfume.getBrand() != null ? perfume.getBrand().getBrandName() : null)
                        .build())
                .collect(Collectors.toList());

        return ApiResponse.success("검색 완료", dtoList);
    }

    @lombok.Data
    @lombok.Builder
    static class PerfumeSearchDTO {
        private Long perfumeId;
        private String name;
        private Integer price;
        private String imageUrl;
        private String brandName;
    }
}