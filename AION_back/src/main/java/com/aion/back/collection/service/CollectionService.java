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
import java.sql.Timestamp;
import java.time.LocalDateTime;
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

    // Collections 테이블도 모두 DataSource 직접 쿼리로 처리
    private CollectionEntity findCollectionById(UUID id) {
        String sql = "SELECT * FROM \"Collections\" WHERE collection_id = ?::uuid";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id.toString());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapCollectionEntity(rs);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("컬렉션 조회 오류: " + e.getMessage(), e);
        }
        throw new RuntimeException("컬렉션을 찾을 수 없습니다.");
    }

    private boolean collectionExists(UUID id) {
        String sql = "SELECT COUNT(*) FROM \"Collections\" WHERE collection_id = ?::uuid";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id.toString());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (Exception e) {
            throw new RuntimeException("컬렉션 조회 오류: " + e.getMessage(), e);
        }
        return false;
    }

    private CollectionEntity mapCollectionEntity(ResultSet rs) throws Exception {
        CollectionEntity e = new CollectionEntity();
        e.setCollectionId(UUID.fromString(rs.getString("collection_id")));
        e.setTitle(rs.getString("title"));
        e.setDescription(rs.getString("description"));
        e.setType(rs.getString("type"));
        e.setTextColor(rs.getString("text_color"));
        e.setIsPublished(rs.getBoolean("is_published"));
        e.setIsActive(rs.getBoolean("is_active"));
        Timestamp createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) e.setCreatedAt(createdAt.toLocalDateTime());
        Timestamp visibleFrom = rs.getTimestamp("visible_from");
        if (visibleFrom != null) e.setVisibleFrom(visibleFrom.toLocalDateTime());
        Timestamp visibleUntil = rs.getTimestamp("visible_until");
        if (visibleUntil != null) e.setVisibleUntil(visibleUntil.toLocalDateTime());
        return e;
    }

    @Transactional(readOnly = true)
    public List<CollectionSummaryResponse> getList(String type) {
        String sql = "SELECT * FROM \"Collections\" WHERE type = ? ORDER BY created_at DESC";
        List<CollectionSummaryResponse> result = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, type);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    result.add(CollectionSummaryResponse.from(mapCollectionEntity(rs)));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("목록 조회 오류: " + e.getMessage(), e);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public CollectionDetailResponse getDetail(String token, UUID collectionId) {
        validateAdmin(token);
        return buildDetail(collectionId);
    }

    @Transactional
    public CollectionDetailResponse create(String token, CollectionSaveRequest req) {
        validateAdmin(token);

        UUID newId = UUID.randomUUID();
        String sql = "INSERT INTO \"Collections\" (collection_id, title, description, type, text_color, is_published, is_active, visible_from, visible_until, created_at, updated_at) " +
                     "VALUES (?::uuid, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newId.toString());
            ps.setString(2, req.getTitle());
            ps.setString(3, req.getDescription());
            ps.setString(4, req.getType());
            ps.setString(5, req.getTextColor() != null ? req.getTextColor() : "#c9a961");
            ps.setBoolean(6, req.getIsPublished() != null ? req.getIsPublished() : false);
            ps.setBoolean(7, req.getIsActive() != null ? req.getIsActive() : false);
            ps.setObject(8, req.getVisibleFrom() != null ? Timestamp.valueOf(req.getVisibleFrom()) : null);
            ps.setObject(9, req.getVisibleUntil() != null ? Timestamp.valueOf(req.getVisibleUntil()) : null);
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("컬렉션 생성 오류: " + e.getMessage(), e);
        }

        saveSubData(newId, req);
        return buildDetail(newId);
    }

    @Transactional
    public CollectionDetailResponse update(String token, UUID collectionId, CollectionSaveRequest req) {
        validateAdmin(token);

        String sql = "UPDATE \"Collections\" SET title=?, description=?, text_color=?, is_published=?, is_active=?, visible_from=?, visible_until=?, updated_at=NOW() WHERE collection_id=?::uuid";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, req.getTitle());
            ps.setString(2, req.getDescription());
            ps.setString(3, req.getTextColor());
            ps.setBoolean(4, req.getIsPublished() != null ? req.getIsPublished() : false);
            ps.setBoolean(5, req.getIsActive() != null ? req.getIsActive() : false);
            ps.setObject(6, req.getVisibleFrom() != null ? Timestamp.valueOf(req.getVisibleFrom()) : null);
            ps.setObject(7, req.getVisibleUntil() != null ? Timestamp.valueOf(req.getVisibleUntil()) : null);
            ps.setString(8, collectionId.toString());
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("컬렉션 수정 오류: " + e.getMessage(), e);
        }

        // isActive=true로 저장 시 같은 type의 다른 컬렉션은 비활성화
        if (Boolean.TRUE.equals(req.getIsActive())) {
            String currentType = req.getType() != null ? req.getType() : findCollectionById(collectionId).getType();
            String deactivateOthersSql = "UPDATE \"Collections\" SET is_active = false WHERE type = ? AND collection_id != ?::uuid";
            try (Connection deactConn = dataSource.getConnection();
                 PreparedStatement deactPs = deactConn.prepareStatement(deactivateOthersSql)) {
                deactPs.setString(1, currentType);
                deactPs.setString(2, collectionId.toString());
                deactPs.executeUpdate();
            } catch (Exception e) {
                throw new RuntimeException("다른 컬렉션 비활성화 오류: " + e.getMessage(), e);
            }
        }

        // DataSource 직접 사용
        try (Connection delConn = dataSource.getConnection()) {
            for (String tbl : new String[]{"Collection_Media", "Collection_Text_Blocks", "Collection_Perfumes"}) {
                try (PreparedStatement ps = delConn.prepareStatement(
                        "DELETE FROM \"" + tbl + "\" WHERE collection_id = ?::uuid")) {
                    ps.setString(1, collectionId.toString());
                    ps.executeUpdate();
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("하위 데이터 삭제 오류: " + e.getMessage(), e);
        }
        saveSubData(collectionId, req);
        return buildDetail(collectionId);
    }

    @Transactional
    public void toggleActive(String token, UUID collectionId, boolean activate) {
        validateAdmin(token);

        // 같은 type의 모든 컬렉션 비활성화 후 해당 컬렉션만 활성화
        String type = findCollectionById(collectionId).getType();
        String deactivateSql = "UPDATE \"Collections\" SET is_active = false WHERE type = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(deactivateSql)) {
            ps.setString(1, type);
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("비활성화 오류: " + e.getMessage(), e);
        }

        if (activate) {
            String activateSql = "UPDATE \"Collections\" SET is_active = true WHERE collection_id = ?::uuid";
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(activateSql)) {
                ps.setString(1, collectionId.toString());
                ps.executeUpdate();
            } catch (Exception e) {
                throw new RuntimeException("활성화 오류: " + e.getMessage(), e);
            }
        }
    }

    @Transactional
    public void delete(String token, UUID collectionId) {
        validateAdmin(token);
        if (!collectionExists(collectionId)) throw new RuntimeException("컬렉션을 찾을 수 없습니다.");

        // DataSource 직접 사용 (Repository 네이티브 쿼리 ::uuid 파싱 오류 방지)
        try (Connection delConn = dataSource.getConnection()) {
            for (String tbl : new String[]{"Collection_Media", "Collection_Text_Blocks", "Collection_Perfumes"}) {
                try (PreparedStatement ps = delConn.prepareStatement(
                        "DELETE FROM \"" + tbl + "\" WHERE collection_id = ?::uuid")) {
                    ps.setString(1, collectionId.toString());
                    ps.executeUpdate();
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("하위 데이터 삭제 오류: " + e.getMessage(), e);
        }

        String sql = "DELETE FROM \"Collections\" WHERE collection_id = ?::uuid";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, collectionId.toString());
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("삭제 오류: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public CollectionDetailResponse getActiveCollection(String type) {
        String sql = "SELECT * FROM \"Collections\" WHERE type = ? AND is_active = true LIMIT 1";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, type);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    CollectionEntity collection = mapCollectionEntity(rs);
                    return buildDetail(collection.getCollectionId());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("활성 컬렉션 조회 오류: " + e.getMessage(), e);
        }
        throw new RuntimeException("활성화된 컬렉션이 없습니다.");
    }

    // ========== 내부 헬퍼 ==========

    private void saveSubData(UUID collectionId, CollectionSaveRequest req) {
        try (Connection conn = dataSource.getConnection()) {
            if (req.getMediaList() != null && !req.getMediaList().isEmpty()) {
                String sql = "INSERT INTO \"Collection_Media\" (collection_id, media_url, media_type, display_order) VALUES (?::uuid, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    for (CollectionSaveRequest.MediaItem m : req.getMediaList()) {
                        ps.setString(1, collectionId.toString());
                        ps.setString(2, m.getMediaUrl());
                        ps.setString(3, m.getMediaType() != null ? m.getMediaType() : "IMAGE");
                        ps.setObject(4, m.getDisplayOrder());
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }
            }
            if (req.getTextBlocks() != null && !req.getTextBlocks().isEmpty()) {
                String sql = "INSERT INTO \"Collection_Text_Blocks\" (collection_id, content, font_size, font_weight, is_italic, position_x, position_y, display_order) VALUES (?::uuid, ?, ?, ?, ?, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    for (CollectionSaveRequest.TextBlockItem t : req.getTextBlocks()) {
                        ps.setString(1, collectionId.toString());
                        ps.setString(2, t.getContent());
                        ps.setString(3, t.getFontSize());
                        ps.setString(4, t.getFontWeight());
                        ps.setBoolean(5, t.getIsItalic() != null ? t.getIsItalic() : false);
                        ps.setString(6, t.getPositionX());
                        ps.setString(7, t.getPositionY());
                        ps.setObject(8, t.getDisplayOrder());
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }
            }
            if (req.getPerfumes() != null && !req.getPerfumes().isEmpty()) {
                String sql = "INSERT INTO \"Collection_Perfumes\" (collection_id, perfume_id, display_order, is_featured) VALUES (?::uuid, ?, ?, ?) ON CONFLICT (collection_id, perfume_id) DO UPDATE SET display_order = EXCLUDED.display_order, is_featured = EXCLUDED.is_featured";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    for (CollectionSaveRequest.PerfumeItem p : req.getPerfumes()) {
                        ps.setString(1, collectionId.toString());
                        ps.setLong(2, p.getPerfumeId());
                        ps.setObject(3, p.getDisplayOrder());
                        ps.setBoolean(4, p.getIsFeatured() != null ? p.getIsFeatured() : false);
                        ps.addBatch();
                    }
                    ps.executeBatch();
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("서브 데이터 저장 오류: " + e.getMessage(), e);
        }
    }

    private CollectionDetailResponse buildDetail(UUID collectionId) {
        CollectionEntity collection = findCollectionById(collectionId);

        List<CollectionDetailResponse.MediaDto> mediaList = new ArrayList<>();
        List<CollectionDetailResponse.TextBlockDto> textBlocks = new ArrayList<>();
        List<CollectionDetailResponse.PerfumeDto> perfumeDtos = new ArrayList<>();

        try (Connection conn = dataSource.getConnection()) {

            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT media_id, media_url, media_type, display_order FROM \"Collection_Media\" WHERE collection_id = ?::uuid ORDER BY display_order ASC")) {
                ps.setString(1, collectionId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        mediaList.add(CollectionDetailResponse.MediaDto.builder()
                                .mediaId(rs.getString("media_id"))
                                .mediaUrl(rs.getString("media_url"))
                                .mediaType(rs.getString("media_type"))
                                .displayOrder(rs.getObject("display_order") != null ? rs.getInt("display_order") : null)
                                .build());
                    }
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT text_block_id, content, font_size, font_weight, is_italic, position_x, position_y, display_order FROM \"Collection_Text_Blocks\" WHERE collection_id = ?::uuid ORDER BY display_order ASC")) {
                ps.setString(1, collectionId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        textBlocks.add(CollectionDetailResponse.TextBlockDto.builder()
                                .textBlockId(rs.getString("text_block_id"))
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