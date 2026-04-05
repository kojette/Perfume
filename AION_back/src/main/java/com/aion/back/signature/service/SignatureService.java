package com.aion.back.signature.service;

import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import com.aion.back.signature.dto.SignatureDetailResponse;
import com.aion.back.signature.dto.SignatureSaveRequest;
import com.aion.back.signature.dto.SignatureSummaryResponse;
import com.aion.back.signature.entity.SignatureEntity;
import com.aion.back.signature.Repository.SignatureMediaRepository;
import com.aion.back.signature.Repository.SignaturePerfumeRepository;
import com.aion.back.signature.Repository.SignatureRepository;
import com.aion.back.signature.Repository.SignatureTextBlockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SignatureService {

    private static final String TYPE = "SIGNATURE";

    private final SignatureRepository signatureRepository;
    private final SignatureMediaRepository mediaRepository;
    private final SignatureTextBlockRepository textBlockRepository;
    private final SignaturePerfumeRepository perfumeRepository;
    private final MemberService memberService;
    private final DataSource dataSource;



    private void validateAdmin(String token) {
        Member member = memberService.getMemberEntityByToken(token);
        if (!"ADMIN".equals(member.getRole())) {
            throw new RuntimeException("관리자 권한이 없습니다.");
        }
    }



    
    @Transactional(readOnly = true)
    public List<SignatureSummaryResponse> getList(String token) {
        validateAdmin(token);
        String sql = "SELECT * FROM \"Collections\" WHERE type = ? ORDER BY created_at DESC";
        List<SignatureSummaryResponse> result = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, TYPE);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(SignatureSummaryResponse.from(mapEntity(rs)));
            }
        } catch (Exception e) {
            throw new RuntimeException("시그니처 목록 조회 오류: " + e.getMessage(), e);
        }
        return result;
    }



    
    @Transactional(readOnly = true)
    public SignatureDetailResponse getActive() {
        String sql = "SELECT * FROM \"Collections\" WHERE type = ? AND is_active = true LIMIT 1";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, TYPE);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return buildDetail(mapEntity(rs).getCollectionId());
            }
        } catch (Exception e) {
            throw new RuntimeException("활성 시그니처 조회 오류: " + e.getMessage(), e);
        }
        return null;
    }



    
    @Transactional(readOnly = true)
    public SignatureDetailResponse getDetail(String token, UUID collectionId) {
        validateAdmin(token);
        return buildDetail(collectionId);
    }



    
    @Transactional
    public SignatureDetailResponse create(String token, SignatureSaveRequest req) {
        validateAdmin(token);
        UUID newId = UUID.randomUUID();
        String sql = "INSERT INTO \"Collections\" " +
                "(collection_id, title, description, type, text_color, is_published, is_active, visible_from, visible_until, created_at, updated_at) " +
                "VALUES (?::uuid, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newId.toString());
            ps.setString(2, req.getTitle());
            ps.setString(3, req.getDescription());
            ps.setString(4, TYPE);
            ps.setString(5, req.getTextColor() != null ? req.getTextColor() : "#c9a961");
            ps.setBoolean(6, req.getIsPublished() != null ? req.getIsPublished() : false);
            ps.setBoolean(7, req.getIsActive() != null ? req.getIsActive() : false);
            ps.setObject(8, req.getVisibleFrom() != null ? Timestamp.valueOf(req.getVisibleFrom()) : null);
            ps.setObject(9, req.getVisibleUntil() != null ? Timestamp.valueOf(req.getVisibleUntil()) : null);
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("시그니처 생성 오류: " + e.getMessage(), e);
        }
        saveSubData(newId, req);
        return buildDetail(newId);
    }



    
    @Transactional
    public SignatureDetailResponse update(String token, UUID collectionId, SignatureSaveRequest req) {
        validateAdmin(token);

        String sql = "UPDATE \"Collections\" SET title=?, description=?, text_color=?, is_published=?, is_active=?, " +
                "visible_from=?, visible_until=?, updated_at=NOW() WHERE collection_id=?::uuid AND type=?";
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
            ps.setString(9, TYPE);
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("시그니처 수정 오류: " + e.getMessage(), e);
        }


        if (Boolean.TRUE.equals(req.getIsActive())) {
            deactivateOthers(collectionId);
        }


        deleteSubData(collectionId);
        saveSubData(collectionId, req);

        return buildDetail(collectionId);
    }



    
    @Transactional
    public void toggleActive(String token, UUID collectionId, boolean activate) {
        validateAdmin(token);


        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "UPDATE \"Collections\" SET is_active = false WHERE type = ?")) {
            ps.setString(1, TYPE);
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("비활성화 오류: " + e.getMessage(), e);
        }


        if (activate) {
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement ps = conn.prepareStatement(
                         "UPDATE \"Collections\" SET is_active = true WHERE collection_id = ?::uuid AND type = ?")) {
                ps.setString(1, collectionId.toString());
                ps.setString(2, TYPE);
                ps.executeUpdate();
            } catch (Exception e) {
                throw new RuntimeException("활성화 오류: " + e.getMessage(), e);
            }
        }
    }



    
    @Transactional
    public void delete(String token, UUID collectionId) {
        validateAdmin(token);
        if (!signatureExists(collectionId)) {
            throw new RuntimeException("시그니처를 찾을 수 없습니다.");
        }
        deleteSubData(collectionId);
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "DELETE FROM \"Collections\" WHERE collection_id = ?::uuid AND type = ?")) {
            ps.setString(1, collectionId.toString());
            ps.setString(2, TYPE);
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("시그니처 삭제 오류: " + e.getMessage(), e);
        }
    }



    
    private void deactivateOthers(UUID exceptId) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "UPDATE \"Collections\" SET is_active = false WHERE type = ? AND collection_id != ?::uuid")) {
            ps.setString(1, TYPE);
            ps.setString(2, exceptId.toString());
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("다른 시그니처 비활성화 오류: " + e.getMessage(), e);
        }
    }

    
    private void deleteSubData(UUID collectionId) {
        try (Connection conn = dataSource.getConnection()) {
            for (String tbl : new String[]{"Collection_Media", "Collection_Text_Blocks", "Collection_Perfumes"}) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "DELETE FROM \"" + tbl + "\" WHERE collection_id = ?::uuid")) {
                    ps.setString(1, collectionId.toString());
                    ps.executeUpdate();
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("하위 데이터 삭제 오류: " + e.getMessage(), e);
        }
    }

    
    private void saveSubData(UUID collectionId, SignatureSaveRequest req) {
        try (Connection conn = dataSource.getConnection()) {


            if (req.getMediaList() != null && !req.getMediaList().isEmpty()) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO \"Collection_Media\" (collection_id, media_url, media_type, display_order) VALUES (?::uuid, ?, ?, ?)")) {
                    for (SignatureSaveRequest.MediaItem m : req.getMediaList()) {
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
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO \"Collection_Text_Blocks\" (collection_id, content, font_size, font_weight, is_italic, position_x, position_y, display_order) " +
                        "VALUES (?::uuid, ?, ?, ?, ?, ?, ?, ?)")) {
                    for (SignatureSaveRequest.TextBlockItem t : req.getTextBlocks()) {
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
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO \"Collection_Perfumes\" (collection_id, perfume_id, display_order, is_featured) VALUES (?::uuid, ?, ?, ?) " +
                        "ON CONFLICT (collection_id, perfume_id) DO UPDATE SET display_order = EXCLUDED.display_order, is_featured = EXCLUDED.is_featured")) {
                    for (SignatureSaveRequest.PerfumeItem p : req.getPerfumes()) {
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

    
    private SignatureDetailResponse buildDetail(UUID collectionId) {
        SignatureEntity sig = findById(collectionId);

        List<SignatureDetailResponse.MediaDto> mediaList = new ArrayList<>();
        List<SignatureDetailResponse.TextBlockDto> textBlocks = new ArrayList<>();
        List<SignatureDetailResponse.PerfumeDto> perfumeDtos = new ArrayList<>();

        try (Connection conn = dataSource.getConnection()) {


            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT media_id, media_url, media_type, display_order FROM \"Collection_Media\" " +
                    "WHERE collection_id = ?::uuid ORDER BY display_order ASC")) {
                ps.setString(1, collectionId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) mediaList.add(SignatureDetailResponse.MediaDto.builder()
                            .mediaId(rs.getString("media_id"))
                            .mediaUrl(rs.getString("media_url"))
                            .mediaType(rs.getString("media_type"))
                            .displayOrder(rs.getObject("display_order") != null ? rs.getInt("display_order") : null)
                            .build());
                }
            }


            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT text_block_id, content, font_size, font_weight, is_italic, position_x, position_y, display_order " +
                    "FROM \"Collection_Text_Blocks\" WHERE collection_id = ?::uuid ORDER BY display_order ASC")) {
                ps.setString(1, collectionId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) textBlocks.add(SignatureDetailResponse.TextBlockDto.builder()
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


            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT cp.perfume_id, cp.display_order, cp.is_featured, " +
                    "p.name, p.name_en, p.price, p.sale_price, p.sale_rate, " +
                    "b.brand_name, pi.image_url AS thumbnail " +
                    "FROM \"Collection_Perfumes\" cp " +
                    "LEFT JOIN \"Perfumes\" p ON cp.perfume_id = p.perfume_id " +
                    "LEFT JOIN \"Brands\" b ON p.brand_id = b.brand_id " +
                    "LEFT JOIN \"Perfume_Images\" pi ON p.perfume_id = pi.perfume_id AND pi.is_thumbnail = true " +
                    "WHERE cp.collection_id = ?::uuid ORDER BY cp.display_order ASC")) {
                ps.setString(1, collectionId.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) perfumeDtos.add(SignatureDetailResponse.PerfumeDto.builder()
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

        } catch (Exception e) {
            throw new RuntimeException("시그니처 상세 조회 오류: " + e.getMessage(), e);
        }

        return SignatureDetailResponse.builder()
                .collectionId(sig.getCollectionId())
                .title(sig.getTitle())
                .description(sig.getDescription())
                .type(sig.getType())
                .textColor(sig.getTextColor())
                .isPublished(sig.getIsPublished())
                .isActive(sig.getIsActive())
                .visibleFrom(sig.getVisibleFrom())
                .visibleUntil(sig.getVisibleUntil())
                .createdAt(sig.getCreatedAt())
                .mediaList(mediaList)
                .textBlocks(textBlocks)
                .perfumes(perfumeDtos)
                .build();
    }

    
    private SignatureEntity findById(UUID id) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT * FROM \"Collections\" WHERE collection_id = ?::uuid AND type = ?")) {
            ps.setString(1, id.toString());
            ps.setString(2, TYPE);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapEntity(rs);
            }
        } catch (Exception e) {
            throw new RuntimeException("시그니처 조회 오류: " + e.getMessage(), e);
        }
        throw new RuntimeException("시그니처를 찾을 수 없습니다. id=" + id);
    }

    private boolean signatureExists(UUID id) {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT COUNT(*) FROM \"Collections\" WHERE collection_id = ?::uuid AND type = ?")) {
            ps.setString(1, id.toString());
            ps.setString(2, TYPE);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (Exception e) {
            throw new RuntimeException("시그니처 존재 확인 오류: " + e.getMessage(), e);
        }
        return false;
    }

    
    private SignatureEntity mapEntity(ResultSet rs) throws Exception {
        SignatureEntity e = new SignatureEntity();
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
}