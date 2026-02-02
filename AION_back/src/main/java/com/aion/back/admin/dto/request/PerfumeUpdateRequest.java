package com.aion.back.admin.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerfumeUpdateRequest {
    private String name;
    private String nameEn;
    private String description;
    private Integer price;
    private Integer saleRate;
    private Integer volumeMl;
    private String concentration;
    private String gender;
    private Integer totalStock;
    private List<String> imageUrls;
    private List<PerfumeCreateRequest.NoteRequest> notes;
    private List<Long> tagIds;
}
