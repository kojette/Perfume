package com.aion.back.collection.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PerfumeNotesResponse {

    private Long perfumeId;
    private List<String> top;
    private List<String> middle;
    private List<String> base;
}