package com.aion.back.customization.service;

import com.aion.back.customization.dto.request.CustomBottleRequest;
import com.aion.back.customization.dto.request.CustomDesignRequest;
import com.aion.back.customization.dto.response.CustomBottleResponse;
import com.aion.back.customization.dto.response.CustomDesignResponse;
import com.aion.back.customization.entity.CustomBottle;
import com.aion.back.customization.entity.CustomDesign;
import com.aion.back.customization.repository.CustomBottleRepository;
import com.aion.back.customization.repository.CustomDesignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DesignService {

    private final CustomDesignRepository customDesignRepository;
    private final CustomBottleRepository customBottleRepository;

    public List<CustomBottleResponse> getActiveBottles() {
        return customBottleRepository.findByIsActiveTrueOrderByCreatedAtAsc()
                .stream()
                .map(CustomBottleResponse::from)
                .collect(Collectors.toList());
    }

    public List<CustomBottleResponse> getAllBottles() {
        return customBottleRepository.findAll()
                .stream()
                .map(CustomBottleResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomBottleResponse createBottle(CustomBottleRequest request) {
        CustomBottle bottle = CustomBottle.builder()
                .name(request.getName())
                .shape(request.getShape())
                .basePrice(request.getBasePrice() != null ? request.getBasePrice() : 15000)
                .isActive(true)
                .build();
        return CustomBottleResponse.from(customBottleRepository.save(bottle));
    }

    @Transactional
    public CustomBottleResponse toggleBottleActive(Long bottleId) {
        CustomBottle bottle = customBottleRepository.findById(bottleId)
                .orElseThrow(() -> new RuntimeException("공병을 찾을 수 없습니다. id=" + bottleId));
        bottle.setIsActive(!bottle.getIsActive());
        return CustomBottleResponse.from(customBottleRepository.save(bottle));
    }

    @Transactional
    public void deleteBottle(Long bottleId) {
        if (!customBottleRepository.existsById(bottleId)) {
            throw new RuntimeException("공병을 찾을 수 없습니다. id=" + bottleId);
        }
        customBottleRepository.deleteById(bottleId);
    }

    public List<CustomDesignResponse> getMyDesigns(Long userId) {
        return customDesignRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(CustomDesignResponse::from)
                .collect(Collectors.toList());
    }

    public CustomDesignResponse getDesign(Long designId, Long userId) {
        CustomDesign design = customDesignRepository.findByDesignIdAndUserId(designId, userId)
                .orElseThrow(() -> new RuntimeException("디자인을 찾을 수 없습니다."));
        return CustomDesignResponse.from(design);
    }

    @Transactional
    public CustomDesignResponse saveDesign(Long userId, CustomDesignRequest request) {
        CustomDesign design = CustomDesign.builder()
                .userId(userId)
                .name(request.getName())
                .bottleKey(request.getBottleKey())
                .bottleColor(request.getBottleColor())
                .engravingText(request.getEngravingText())
                .objectsJson(request.getObjectsJson())
                .previewImageUrl(request.getPreviewImageUrl())
                .bottlePrice(request.getBottlePrice() != null ? request.getBottlePrice() : 0)
                .printingPrice(request.getPrintingPrice() != null ? request.getPrintingPrice() : 0)
                .stickerPrice(request.getStickerPrice() != null ? request.getStickerPrice() : 0)
                .engravingPrice(request.getEngravingPrice() != null ? request.getEngravingPrice() : 0)
                .totalPrice(request.getTotalPrice() != null ? request.getTotalPrice() : 0)
                .build();
        return CustomDesignResponse.from(customDesignRepository.save(design));
    }

    @Transactional
    public CustomDesignResponse updateDesign(Long designId, Long userId, CustomDesignRequest request) {
        CustomDesign design = customDesignRepository.findByDesignIdAndUserId(designId, userId)
                .orElseThrow(() -> new RuntimeException("디자인을 찾을 수 없습니다."));

        design.setName(request.getName());
        design.setBottleKey(request.getBottleKey());
        design.setBottleColor(request.getBottleColor());
        design.setEngravingText(request.getEngravingText());
        design.setObjectsJson(request.getObjectsJson());
        design.setPreviewImageUrl(request.getPreviewImageUrl());
        design.setBottlePrice(request.getBottlePrice() != null ? request.getBottlePrice() : 0);
        design.setPrintingPrice(request.getPrintingPrice() != null ? request.getPrintingPrice() : 0);
        design.setStickerPrice(request.getStickerPrice() != null ? request.getStickerPrice() : 0);
        design.setEngravingPrice(request.getEngravingPrice() != null ? request.getEngravingPrice() : 0);
        design.setTotalPrice(request.getTotalPrice() != null ? request.getTotalPrice() : 0);

        return CustomDesignResponse.from(customDesignRepository.save(design));
    }

    @Transactional
    public void deleteDesign(Long designId, Long userId) {
        CustomDesign design = customDesignRepository.findByDesignIdAndUserId(designId, userId)
                .orElseThrow(() -> new RuntimeException("디자인을 찾을 수 없습니다."));
        customDesignRepository.delete(design);
    }
}