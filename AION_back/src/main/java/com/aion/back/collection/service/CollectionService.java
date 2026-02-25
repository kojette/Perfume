package com.aion.back.collection.service;

import com.aion.back.collection.dto.CollectionDetailResponse;
import com.aion.back.collection.dto.CollectionSaveRequest;
import com.aion.back.collection.dto.CollectionSummaryResponse;
import com.aion.back.collection.entity.CollectionEntity;
import com.aion.back.collection.entity.CollectionMedia;
import com.aion.back.collection.entity.CollectionPerfume;
import com.aion.back.collection.entity.CollectionTextBlock;
import com.aion.back.collection.repository.CollectionMediaRepository;
import com.aion.back.collection.repository.CollectionPerfumeRepository;
import com.aion.back.collection.repository.CollectionRepository;
import com.aion.back.collection.repository.CollectionTextBlockRepository;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final CollectionMediaRepository mediaRepository;
    private final CollectionTextBlockRepository textBlockRepository;
    private final CollectionPerfumeRepository perfumeRepository;
    private final MemberService memberService;
    private final DataSource dataSource;

    private void validateAdmin(String token) {
        Member member = memberService.getMemberEntityByToken(token);
        if (!"ADMIN".equals(member.getRole())) {
            throw new RuntimeException("관리자 권한이 없습니다.");
        }
    }

    // ========== 관리자용 ==========

    @Transactional(readOnly = true)
    public List<CollectionSummaryResponse> getList(String type) {
        return collectionRepository.findByTypeOrderByCreatedAtDesc(type)
                .stream()
                .map(CollectionSummaryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CollectionDetailResponse getDetail(String token, Long collectionId) {
        validateAdmin(token);
        return buildDetail(collectionId);
    }

    @Transactional
    public CollectionDetailResponse create(String token, CollectionSaveRequest req) {
        validateAdmin(token);

        CollectionEntity collection = CollectionEntity.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .type(req.getType())
                .textColor(req.getTextColor() != null ? req.getTextColor() : "#c9a961")
                .isPublished(req.getIsPublished() != null ? req.getIsPublished() : false)
                .isActive(false)
                .build();

        collectionRepository.save(collection);
        saveSubData(collection.getCollectionId(), req);

        return buildDetail(collection.getCollectionId());
    }

    @Transactional
    public CollectionDetailResponse update(String token, Long collectionId, CollectionSaveRequest req) {
        validateAdmin(token);

        CollectionEntity collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("컬렉션을 찾을 수 없습니다."));

        collection.setTitle(req.getTitle());
        collection.setDescription(req.getDescription());
        collection.setTextColor(req.getTextColor());
        collection.setIsPublished(req.getIsPublished() != null ? req.getIsPublished() : false);

        mediaRepository.deleteByCollectionId(collectionId);
        textBlockRepository.deleteByCollectionId(collectionId);
        perfumeRepository.deleteByCollectionId(collectionId);

        saveSubData(collectionId, req);

        return buildDetail(collectionId);
    }

    @Transactional
    public void toggleActive(String token, Long collectionId, boolean activate) {
        validateAdmin(token);

        CollectionEntity collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("컬렉션을 찾을 수 없습니다."));

        // 같은 타입의 모든 컬렉션 비활성화
        collectionRepository.findByTypeOrderByCreatedAtDesc(collection.getType())
                .forEach(c -> c.setIsActive(false));

        if (activate) {
            collection.setIsActive(true);
        }
    }

    @Transactional
    public void delete(String token, Long collectionId) {
        validateAdmin(token);

        if (!collectionRepository.existsById(collectionId)) {
            throw new RuntimeException("컬렉션을 찾을 수 없습니다.");
        }

        mediaRepository.deleteByCollectionId(collectionId);
        textBlockRepository.deleteByCollectionId(collectionId);
        perfumeRepository.deleteByCollectionId(collectionId);
        collectionRepository.deleteById(collectionId);
    }

    // ========== 공개용 ==========

    @Transactional(readOnly = true)
    public CollectionDetailResponse getActiveCollection(String type) {
        CollectionEntity collection = collectionRepository.findByTypeAndIsActiveTrue(type)
                .orElseThrow(() -> new RuntimeException("활성화된 컬렉션이 없습니다."));

        return buildDetail(collection.getCollectionId());
    }

    // ========== 내부 헬퍼 ==========

    private void saveSubData(Long collectionId, CollectionSaveRequest req) {
        if (req.getMediaList() != null) {
            List<CollectionMedia> mediaEntities = req.getMediaList().stream()
                    .map(m -> CollectionMedia.builder()
                            .collectionId(collectionId)
                            .mediaUrl(m.getMediaUrl())
                            .mediaType(m.getMediaType() != null ? m.getMediaType() : "IMAGE")
                            .displayOrder(m.getDisplayOrder())
                            .build())
                    .collect(Collectors.toList());
            mediaRepository.saveAll(mediaEntities);
        }

        if (req.getTextBlocks() != null) {
            List<CollectionTextBlock> textEntities = req.getTextBlocks().stream()
                    .map(t -> CollectionTextBlock.builder()
                            .collectionId(collectionId)
                            .content(t.getContent())
                            .fontSize(t.getFontSize())
                            .fontWeight(t.getFontWeight())
                            .isItalic(t.getIsItalic() != null ? t.getIsItalic() : false)
                            .positionX(t.getPositionX())
                            .positionY(t.getPositionY())
                            .displayOrder(t.getDisplayOrder())
                            .build())
                    .collect(Collectors.toList());
            textBlockRepository.saveAll(textEntities);
        }

        if (req.getPerfumes() != null) {
            List<CollectionPerfume> perfumeEntities = req.getPerfumes().stream()
                    .map(p -> CollectionPerfume.builder()
                            .collectionId(collectionId)
                            .perfumeId(p.getPerfumeId())
                            .displayOrder(p.getDisplayOrder())
                            .isFeatured(p.getIsFeatured() != null ? p.getIsFeatured() : false)
                            .build())
                    .collect(Collectors.toList());
            perfumeRepository.saveAll(perfumeEntities);
        }
    }

    private CollectionDetailResponse buildDetail(Long collectionId) {
        CollectionEntity collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("컬렉션을 찾을 수 없습니다."));

        List<CollectionMedia> mediaList = mediaRepository.findByCollectionIdOrderByDisplayOrderAsc(collectionId);
        List<CollectionTextBlock> textBlocks = textBlockRepository.findByCollectionIdOrderByDisplayOrderAsc(collectionId);
        List<CollectionPerfume> collectionPerfumes = perfumeRepository.findByCollectionIdOrderByDisplayOrderAsc(collectionId);

        List<Long> perfumeIds = collectionPerfumes.stream()
                .map(CollectionPerfume::getPerfumeId)
                .collect(Collectors.toList());

        Map<Long, CollectionDetailResponse.PerfumeDto> perfumeMap = fetchPerfumeDetails(perfumeIds);

        List<CollectionDetailResponse.PerfumeDto> perfumeDtos = collectionPerfumes.stream()
                .map(cp -> {
                    CollectionDetailResponse.PerfumeDto base = perfumeMap.get(cp.getPerfumeId());
                    if (base == null) return null;
                    return CollectionDetailResponse.PerfumeDto.builder()
                            .perfumeId(base.getPerfumeId())
                            .name(base.getName())
                            .nameEn(base.getNameEn())
                            .price(base.getPrice())
                            .salePrice(base.getSalePrice())
                            .saleRate(base.getSaleRate())
                            .brandName(base.getBrandName())
                            .thumbnail(base.getThumbnail())
                            .displayOrder(cp.getDisplayOrder())
                            .isFeatured(cp.getIsFeatured())
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return CollectionDetailResponse.builder()
                .collectionId(collection.getCollectionId())
                .title(collection.getTitle())
                .description(collection.getDescription())
                .type(collection.getType())
                .textColor(collection.getTextColor())
                .isPublished(collection.getIsPublished())
                .isActive(collection.getIsActive())
                .createdAt(collection.getCreatedAt())
                .mediaList(mediaList.stream().map(CollectionDetailResponse.MediaDto::from).collect(Collectors.toList()))
                .textBlocks(textBlocks.stream().map(CollectionDetailResponse.TextBlockDto::from).collect(Collectors.toList()))
                .perfumes(perfumeDtos)
                .build();
    }

    private Map<Long, CollectionDetailResponse.PerfumeDto> fetchPerfumeDetails(List<Long> perfumeIds) {
        if (perfumeIds.isEmpty()) return Collections.emptyMap();

        Map<Long, CollectionDetailResponse.PerfumeDto> result = new HashMap<>();

        String placeholders = perfumeIds.stream().map(id -> "?").collect(Collectors.joining(","));
        String sql = "SELECT p.perfume_id, p.name, p.name_en, p.price, p.sale_price, p.sale_rate, " +
                "b.brand_name, pi.image_url as thumbnail " +
                "FROM \"Perfumes\" p " +
                "LEFT JOIN \"Brands\" b ON p.brand_id = b.brand_id " +
                "LEFT JOIN \"Perfume_Images\" pi ON p.perfume_id = pi.perfume_id AND pi.is_thumbnail = true " +
                "WHERE p.perfume_id IN (" + placeholders + ")";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (int i = 0; i < perfumeIds.size(); i++) {
                ps.setLong(i + 1, perfumeIds.get(i));
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Long id = rs.getLong("perfume_id");
                    result.put(id, CollectionDetailResponse.PerfumeDto.builder()
                            .perfumeId(id)
                            .name(rs.getString("name"))
                            .nameEn(rs.getString("name_en"))
                            .price(rs.getObject("price") != null ? rs.getInt("price") : null)
                            .salePrice(rs.getObject("sale_price") != null ? rs.getInt("sale_price") : null)
                            .saleRate(rs.getObject("sale_rate") != null ? rs.getInt("sale_rate") : null)
                            .brandName(rs.getString("brand_name"))
                            .thumbnail(rs.getString("thumbnail"))
                            .build());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("향수 정보 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }

        return result;
    }
}