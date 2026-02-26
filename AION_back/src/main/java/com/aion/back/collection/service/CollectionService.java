package com.aion.back.collection.service;

import com.aion.back.collection.dto.CollectionDetailResponse;
import com.aion.back.collection.dto.CollectionSaveRequest;
import com.aion.back.collection.dto.CollectionSummaryResponse;
import com.aion.back.collection.entity.CollectionEntity;
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
import java.util.*;
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

    @Transactional(readOnly = true)
    public List<CollectionSummaryResponse> getList(String type) {
        return collectionRepository.findByTypeOrderByCreatedAtDesc(type)
                .stream()
                .map(CollectionSummaryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CollectionDetailResponse getDetail(String token, UUID collectionId) {
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
                .isActive(req.getIsActive() != null ? req.getIsActive() : false)
                .visibleFrom(req.getVisibleFrom())
                .visibleUntil(req.getVisibleUntil())
                .build();

        collectionRepository.save(collection);
        saveSubData(collection.getCollectionId(), req);

        return buildDetail(collection.getCollectionId());
    }

    @Transactional
    public CollectionDetailResponse update(String token, UUID collectionId, CollectionSaveRequest req) {
        validateAdmin(token);

        CollectionEntity collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("컬렉션을 찾을 수 없습니다."));

        collection.setTitle(req.getTitle());
        collection.setDescription(req.getDescription());
        collection.setTextColor(req.getTextColor());
        collection.setIsPublished(req.getIsPublished() != null ? req.getIsPublished() : false);
        collection.setVisibleFrom(req.getVisibleFrom());
        collection.setVisibleUntil(req.getVisibleUntil());
        if (req.getIsActive() != null) {
            collection.setIsActive(req.getIsActive());
        }

        mediaRepository.deleteByCollectionId(collectionId);
        textBlockRepository.deleteByCollectionId(collectionId);
        perfumeRepository.deleteByCollectionId(collectionId);

        saveSubData(collectionId, req);
        return buildDetail(collectionId);
    }

    @Transactional
    public void toggleActive(String token, UUID collectionId, boolean activate) {
        validateAdmin(token);
        CollectionEntity collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("컬렉션을 찾을 수 없습니다."));
        collectionRepository.findByTypeOrderByCreatedAtDesc(collection.getType())
                .forEach(c -> c.setIsActive(false));
        if (activate) collection.setIsActive(true);
    }

    @Transactional
    public void delete(String token, UUID collectionId) {
        validateAdmin(token);
        if (!collectionRepository.existsById(collectionId))
            throw new RuntimeException("컬렉션을 찾을 수 없습니다.");
        mediaRepository.deleteByCollectionId(collectionId);
        textBlockRepository.deleteByCollectionId(collectionId);
        perfumeRepository.deleteByCollectionId(collectionId);
        collectionRepository.deleteById(collectionId);
    }

    @Transactional(readOnly = true)
    public CollectionDetailResponse getActiveCollection(String type) {
        CollectionEntity collection = collectionRepository.findByTypeAndIsActiveTrue(type)
                .orElseThrow(() -> new RuntimeException("활성화된 컬렉션이 없습니다."));
        return buildDetail(collection.getCollectionId());
    }

    // ========== 내부 헬퍼 ==========

    private void saveSubData(UUID collectionId, CollectionSaveRequest req) {
        if (req.getMediaList() != null) {
            for (CollectionSaveRequest.MediaItem m : req.getMediaList()) {
                mediaRepository.insertMedia(collectionId, m.getMediaUrl(),
                        m.getMediaType() != null ? m.getMediaType() : "IMAGE", m.getDisplayOrder());
            }
        }
        if (req.getTextBlocks() != null) {
            for (CollectionSaveRequest.TextBlockItem t : req.getTextBlocks()) {
                textBlockRepository.insertTextBlock(collectionId, t.getContent(),
                        t.getFontSize(), t.getFontWeight(),
                        t.getIsItalic() != null ? t.getIsItalic() : false,
                        t.getPositionX(), t.getPositionY(), t.getDisplayOrder());
            }
        }
        if (req.getPerfumes() != null) {
            for (CollectionSaveRequest.PerfumeItem p : req.getPerfumes()) {
                perfumeRepository.insertPerfume(collectionId, p.getPerfumeId(),
                        p.getDisplayOrder(), p.getIsFeatured() != null ? p.getIsFeatured() : false);
            }
        }
    }

    // 모든 하위 데이터를 DataSource 직접 쿼리로 조회 → Hibernate 타입 매핑 완전 우회
    private CollectionDetailResponse buildDetail(UUID collectionId) {
        CollectionEntity collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("컬렉션을 찾을 수 없습니다."));

        List<CollectionDetailResponse.MediaDto> mediaList = new ArrayList<>();
        List<CollectionDetailResponse.TextBlockDto> textBlocks = new ArrayList<>();
        List<CollectionDetailResponse.PerfumeDto> perfumeDtos = new ArrayList<>();

        try (Connection conn = dataSource.getConnection()) {

            // 미디어 조회
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT media_id, media_url, media_type, display_order FROM \"Collection_Media\" WHERE collection_id = ?::uuid ORDER BY display_order ASC")) {
                ps.setString(1, collectionId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        mediaList.add(CollectionDetailResponse.MediaDto.builder()
                                .mediaId(rs.getLong("media_id"))
                                .mediaUrl(rs.getString("media_url"))
                                .mediaType(rs.getString("media_type"))
                                .displayOrder(rs.getObject("display_order") != null ? rs.getInt("display_order") : null)
                                .build());
                    }
                }
            }

            // 텍스트블록 조회
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT text_block_id, content, font_size, font_weight, is_italic, position_x, position_y, display_order FROM \"Collection_Text_Blocks\" WHERE collection_id = ?::uuid ORDER BY display_order ASC")) {
                ps.setString(1, collectionId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        textBlocks.add(CollectionDetailResponse.TextBlockDto.builder()
                                .textBlockId(rs.getLong("text_block_id"))
                                .content(rs.getString("content"))
                                .fontSize(rs.getString("font_size"))
                                .fontWeight(rs.getString("font_weight"))
                                .isItalic(rs.getBoolean("is_italic"))
                                .positionX(rs.getString("position_x"))
                                .positionY(rs.getString("position_y"))
                                .displayOrder(rs.getObject("display_order") != null ? rs.getInt("display_order") : null)
                                .build());
                    }
                }
            }

            // 향수 조회 (perfume 상세 포함)
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT cp.perfume_id, cp.display_order, cp.is_featured, " +
                    "p.name, p.name_en, p.price, p.sale_price, p.sale_rate, " +
                    "b.brand_name, pi.image_url as thumbnail " +
                    "FROM \"Collection_Perfumes\" cp " +
                    "LEFT JOIN \"Perfumes\" p ON cp.perfume_id = p.perfume_id " +
                    "LEFT JOIN \"Brands\" b ON p.brand_id = b.brand_id " +
                    "LEFT JOIN \"Perfume_Images\" pi ON p.perfume_id = pi.perfume_id AND pi.is_thumbnail = true " +
                    "WHERE cp.collection_id = ?::uuid ORDER BY cp.display_order ASC")) {
                ps.setString(1, collectionId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        perfumeDtos.add(CollectionDetailResponse.PerfumeDto.builder()
                                .perfumeId(rs.getLong("perfume_id"))
                                .name(rs.getString("name"))
                                .nameEn(rs.getString("name_en"))
                                .price(rs.getObject("price") != null ? rs.getInt("price") : null)
                                .salePrice(rs.getObject("sale_price") != null ? rs.getInt("sale_price") : null)
                                .saleRate(rs.getObject("sale_rate") != null ? rs.getInt("sale_rate") : null)
                                .brandName(rs.getString("brand_name"))
                                .thumbnail(rs.getString("thumbnail"))
                                .displayOrder(rs.getObject("display_order") != null ? rs.getInt("display_order") : null)
                                .isFeatured(rs.getBoolean("is_featured"))
                                .build());
                    }
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("컬렉션 상세 조회 중 오류: " + e.getMessage(), e);
        }

        return CollectionDetailResponse.builder()
                .collectionId(collection.getCollectionId())
                .title(collection.getTitle())
                .description(collection.getDescription())
                .type(collection.getType())
                .textColor(collection.getTextColor())
                .isPublished(collection.getIsPublished())
                .isActive(collection.getIsActive())
                .visibleFrom(collection.getVisibleFrom())
                .visibleUntil(collection.getVisibleUntil())
                .createdAt(collection.getCreatedAt())
                .mediaList(mediaList)
                .textBlocks(textBlocks)
                .perfumes(perfumeDtos)
                .build();
    }
}
