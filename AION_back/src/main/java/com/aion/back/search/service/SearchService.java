package com.aion.back.search.service;
import com.aion.back.perfume.repository.PerfumeRepository;
import com.aion.back.perfume.repository.PerfumeSearchProjection;
import com.aion.back.search.dto.response.SearchResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class SearchService {

    private final PerfumeRepository perfumeRepository;

    public List<SearchResultResponse> searchPerfumes(String keyword) {
        List<PerfumeSearchProjection> searchResults = perfumeRepository.searchWithImages(keyword);
        return searchResults.stream().map(proj ->
                SearchResultResponse.builder()
                        .perfumeId(proj.getPerfumeId())
                        .name(proj.getName())
                        .price(proj.getPrice())
                        .brandName(proj.getBrandName())
                        .imageUrl(proj.getImageUrl())  
                        .build()
        ).collect(Collectors.toList());
    }
}