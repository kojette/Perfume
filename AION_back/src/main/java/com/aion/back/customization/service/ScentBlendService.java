package com.aion.back.customization.service;

import com.aion.back.customization.dto.request.CustomScentBlendRequest;
import com.aion.back.customization.dto.response.CustomScentBlendResponse;
import com.aion.back.customization.dto.response.IngredientResponse;
import com.aion.back.customization.dto.response.ScentCategoryWithIngredientsResponse;
import com.aion.back.customization.entity.CustomScentBlend;
import com.aion.back.customization.entity.CustomScentBlendItem;
import com.aion.back.customization.repository.CustomScentBlendRepository;
import com.aion.back.customization.repository.ScentCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScentBlendService {

    private final ScentCategoryRepository categoryRepository;
    private final CustomScentBlendRepository blendRepository;

    @Cacheable(value = "scentCategories")
    public List<ScentCategoryWithIngredientsResponse> getScentCategoriesWithIngredients() {
        return categoryRepository.findActiveWithIngredients().stream()
                .map(cat -> ScentCategoryWithIngredientsResponse.of(
                        cat,
                        cat.getIngredients().stream()
                                .map(IngredientResponse::from)
                                .toList()
                ))
                .toList();
    }

    public List<CustomScentBlendResponse> getMyBlends(Long userId) {
        return blendRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(CustomScentBlendResponse::from)
                .toList();
    }

    @Transactional
    public CustomScentBlendResponse saveBlend(Long userId, CustomScentBlendRequest request) {
        CustomScentBlend blend = CustomScentBlend.builder()
                .userId(userId)
                .name(request.getName())
                .concentration(request.getConcentration())
                .volumeMl(request.getVolumeMl())
                .totalPrice(request.getTotalPrice())
                .build();

        if (request.getItems() != null) {
            for (CustomScentBlendRequest.BlendItemRequest itemReq : request.getItems()) {
                CustomScentBlendItem item = CustomScentBlendItem.builder()
                        .blend(blend)
                        .ingredientId(itemReq.getIngredientId())
                        .ratio(itemReq.getRatio())
                        .build();
                blend.getItems().add(item);
            }
        }

        return CustomScentBlendResponse.from(blendRepository.save(blend));
    }

    @Transactional
    public void deleteBlend(Long blendId, Long userId) {
        CustomScentBlend blend = blendRepository.findByBlendIdAndUserIdWithItems(blendId, userId)
                .orElseThrow(() -> new RuntimeException("조합을 찾을 수 없습니다."));
        blendRepository.delete(blend);
    }

    @CacheEvict(value = "scentCategories", allEntries = true)
    public void evictScentCache() {
    }
}