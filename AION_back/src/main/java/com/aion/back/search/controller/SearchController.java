package com.aion.back.search.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.search.dto.response.SearchResultResponse;
import com.aion.back.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/functions")
    public ApiResponse<List<SearchResultResponse>> searchPerfumes(@RequestParam("keyword") String keyword) {

        List<SearchResultResponse> results = searchService.searchPerfumes(keyword);

        return ApiResponse.success("검색 완료", results);
    }
}