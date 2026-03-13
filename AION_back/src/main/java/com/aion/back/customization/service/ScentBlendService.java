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

    // ✅ 제거: ingredientRepository 직접 주입 불필요 (JOIN FETCH로 해결)

    /**
     * 활성 카테고리 + 소속 재료 목록 반환
     * GET /api/custom/scents
     *
     * ✅ 최적화 1: @Cacheable — 첫 요청만 DB 조회, 이후 메모리 캐시 반환 (TTL 1시간)
     * ✅ 최적화 2: JOIN FETCH로 DB 쿼리 2번 → 1번으로 감소
     * ✅ 최적화 3: Java 그룹핑 연산 제거 (DB에서 이미 카테고리별로 묶여서 옴)
     */
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

    /**
     * 내 조합 목록
     * GET /api/custom/scent-blends
     */
    public List<CustomScentBlendResponse> getMyBlends(Long userId) {
        return blendRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(CustomScentBlendResponse::from)
                .toList();
    }

    /**
     * 향 조합 저장
     * POST /api/custom/scent-blends
     */
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

    /**
     * 향 조합 삭제
     * DELETE /api/custom/scent-blends/{blendId}
     */
    @Transactional
    public void deleteBlend(Long blendId, Long userId) {
        CustomScentBlend blend = blendRepository.findByBlendIdAndUserIdWithItems(blendId, userId)
                .orElseThrow(() -> new RuntimeException("조합을 찾을 수 없습니다."));
        blendRepository.delete(blend);
    }

    /**
     * ✅ 관리자용: 재료/카테고리 변경 시 캐시 수동 초기화
     * (향후 관리자 API에서 호출)
     */
    @CacheEvict(value = "scentCategories", allEntries = true)
    public void evictScentCache() {
        // 캐시 무효화만 수행
    }
}