package com.aion.back.admin.controller;

import com.aion.back.common.response.ApiResponse;
import com.aion.back.member.entity.Member;
import com.aion.back.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminStatsController {

    private final JdbcTemplate jdbcTemplate;
    private final MemberService memberService;

    /** 토큰에서 Member를 꺼내고 ADMIN 여부를 검증 */
    private void verifyAdmin(String token) {
        Member member = memberService.getMemberEntityByToken(token);
        // Users 테이블의 role 컬럼이 'ADMIN' 인지 확인
        if (!"ADMIN".equalsIgnoreCase(member.getRole())) {
            throw new RuntimeException("관리자 권한이 필요합니다.");
        }
    }

    // ────────────────────────────────────────────────────────────
    // 1. 메인 KPI 요약
    // ────────────────────────────────────────────────────────────
    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> getSummary(
            @RequestHeader("Authorization") String token) {

        verifyAdmin(token);

        Map<String, Object> result = new LinkedHashMap<>();

        // 오늘 매출/주문
        Map<String, Object> today = jdbcTemplate.queryForMap(
            "SELECT COALESCE(SUM(total_revenue),0) AS today_revenue, " +
            "       COALESCE(SUM(order_count),0)   AS today_orders " +
            "FROM \"Daily_Revenue_Stats\" WHERE stat_date = CURRENT_DATE"
        );
        result.put("todayRevenue", today.get("today_revenue"));
        result.put("todayOrders",  today.get("today_orders"));

        // 오늘 신규 가입
        Object newUsers = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM \"Users\" WHERE DATE(created_at) = CURRENT_DATE", Long.class);
        result.put("todayNewUsers", newUsers);

        // 전체 활성 회원
        Object totalUsers = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM \"Users\" WHERE account_status = 'ACTIVE'", Long.class);
        result.put("totalUsers", totalUsers);

        // 이번 달 매출
        Object monthRevenue = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(total_revenue),0) FROM \"Daily_Revenue_Stats\" " +
            "WHERE stat_date >= DATE_TRUNC('month', CURRENT_DATE)", Long.class);
        result.put("monthRevenue", monthRevenue);

        // 총 장바구니 수
        Object totalCarts = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(cart_count),0) FROM \"Dashboard_Stats\"", Long.class);
        result.put("totalCarts", totalCarts);

        // 총 위시리스트 수
        Object totalWishlists = jdbcTemplate.queryForObject(
            "SELECT COALESCE(SUM(wishlist_count),0) FROM \"Dashboard_Stats\"", Long.class);
        result.put("totalWishlists", totalWishlists);

        // 미답변 문의
        Object pendingInquiries = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM \"Inquiries\" WHERE status = 'pending'", Long.class);
        result.put("pendingInquiries", pendingInquiries);

        return ApiResponse.success("통계 요약 조회 성공", result);
    }

    // ────────────────────────────────────────────────────────────
    // 2. 최근 30일 일별 매출 트렌드
    // ────────────────────────────────────────────────────────────
    @GetMapping("/revenue/daily")
    public ApiResponse<List<Map<String, Object>>> getDailyRevenue(
            @RequestHeader("Authorization") String token) {

        verifyAdmin(token);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT stat_date, total_revenue, order_count, new_users " +
            "FROM \"Daily_Revenue_Stats\" " +
            "WHERE stat_date >= CURRENT_DATE - INTERVAL '30 days' " +
            "ORDER BY stat_date ASC"
        );
        return ApiResponse.success("일별 매출 조회 성공", rows);
    }

    // ────────────────────────────────────────────────────────────
    // 3. 향수별 통계
    // ────────────────────────────────────────────────────────────
    @GetMapping("/perfumes")
    public ApiResponse<List<Map<String, Object>>> getPerfumeStats(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "cart_count") String sortBy,
            @RequestParam(defaultValue = "20") int limit) {

        verifyAdmin(token);

        // SQL 인젝션 방지 화이트리스트
        String safeSort = switch (sortBy) {
            case "wishlist_count", "order_count", "total_revenue",
                 "review_count", "avg_rating", "view_count" -> sortBy;
            default -> "cart_count";
        };

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT ds.perfume_id, ds.perfume_name, ds.brand_name, " +
            "       ds.cart_count, ds.wishlist_count, ds.order_count, " +
            "       ds.total_revenue, ds.review_count, ds.avg_rating, " +
            "       ds.view_count, ds.updated_at " +
            "FROM \"Dashboard_Stats\" ds " +
            "ORDER BY " + safeSort + " DESC NULLS LAST " +
            "LIMIT ?",
            limit
        );
        return ApiResponse.success("향수별 통계 조회 성공", rows);
    }

    // ────────────────────────────────────────────────────────────
    // 4. 향료 사용 통계 (워드클라우드/랭킹)
    // ────────────────────────────────────────────────────────────
    @GetMapping("/ingredients")
    public ApiResponse<List<Map<String, Object>>> getIngredientStats(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "30") int limit) {

        verifyAdmin(token);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT ius.ingredient_id, ius.ingredient_name, " +
            "       ius.usage_count, ius.avg_ratio, " +
            "       i.category_id, sc.category_name " +
            "FROM \"Ingredient_Usage_Stats\" ius " +
            "LEFT JOIN \"Ingredients\" i ON i.ingredient_id = ius.ingredient_id " +
            "LEFT JOIN \"Scent_Categories\" sc ON sc.category_id = i.category_id " +
            "ORDER BY ius.usage_count DESC NULLS LAST " +
            "LIMIT ?",
            limit
        );
        return ApiResponse.success("향료 통계 조회 성공", rows);
    }

    // ────────────────────────────────────────────────────────────
    // 5. 고객 세그먼트 (등급별 분포)
    // ────────────────────────────────────────────────────────────
    @GetMapping("/customers/segments")
    public ApiResponse<List<Map<String, Object>>> getCustomerSegments(
            @RequestHeader("Authorization") String token) {

        verifyAdmin(token);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT mr.rank_name, mr.rank_level, COUNT(u.user_id) AS user_count " +
            "FROM \"Member_Ranks\" mr " +
            "LEFT JOIN \"Users\" u ON u.member_rank_id = mr.rank_id " +
            "  AND u.account_status = 'ACTIVE' " +
            "GROUP BY mr.rank_name, mr.rank_level " +
            "ORDER BY mr.rank_level DESC"
        );

        // 등급 미배정 유저
        Long unranked = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM \"Users\" " +
            "WHERE member_rank_id IS NULL AND account_status = 'ACTIVE'",
            Long.class
        );
        Map<String, Object> unrankedMap = new LinkedHashMap<>();
        unrankedMap.put("rank_name",  "미분류");
        unrankedMap.put("rank_level", 0);
        unrankedMap.put("user_count", unranked);
        rows.add(unrankedMap);

        return ApiResponse.success("고객 세그먼트 조회 성공", rows);
    }

    // ────────────────────────────────────────────────────────────
    // 6. 브랜드별 매출 통계
    // ────────────────────────────────────────────────────────────
    @GetMapping("/brands")
    public ApiResponse<List<Map<String, Object>>> getBrandStats(
            @RequestHeader("Authorization") String token) {

        verifyAdmin(token);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT ds.brand_name, " +
            "       SUM(ds.order_count)    AS total_orders, " +
            "       SUM(ds.total_revenue)  AS total_revenue, " +
            "       SUM(ds.wishlist_count) AS total_wishlists, " +
            "       SUM(ds.cart_count)     AS total_carts " +
            "FROM \"Dashboard_Stats\" ds " +
            "WHERE ds.brand_name IS NOT NULL " +
            "GROUP BY ds.brand_name " +
            "ORDER BY total_revenue DESC NULLS LAST " +
            "LIMIT 10"
        );
        return ApiResponse.success("브랜드별 통계 조회 성공", rows);
    }

    // ────────────────────────────────────────────────────────────
    // 7. 전환율 낮은 상품 (찜 多, 구매 少)
    // ────────────────────────────────────────────────────────────
    @GetMapping("/perfumes/low-conversion")
    public ApiResponse<List<Map<String, Object>>> getLowConversionPerfumes(
            @RequestHeader("Authorization") String token) {

        verifyAdmin(token);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT perfume_id, perfume_name, brand_name, " +
            "       wishlist_count, order_count, cart_count, " +
            "       CASE WHEN wishlist_count > 0 " +
            "            THEN ROUND(order_count::numeric / wishlist_count * 100, 1) " +
            "            ELSE 0 END AS conversion_rate " +
            "FROM \"Dashboard_Stats\" " +
            "WHERE wishlist_count >= 5 " +
            "ORDER BY conversion_rate ASC, wishlist_count DESC " +
            "LIMIT 10"
        );
        return ApiResponse.success("전환율 낮은 상품 조회 성공", rows);
    }

    // ────────────────────────────────────────────────────────────
    // 8. 성별/연령대 인구통계
    // ────────────────────────────────────────────────────────────
    @GetMapping("/customers/demographics")
    public ApiResponse<Map<String, Object>> getDemographics(
            @RequestHeader("Authorization") String token) {

        verifyAdmin(token);

        Map<String, Object> result = new LinkedHashMap<>();

        // 이번 달 성별 구매
        List<Map<String, Object>> genderStats = jdbcTemplate.queryForList(
            "SELECT u.gender, COUNT(DISTINCT o.order_id) AS order_count, " +
            "       COALESCE(SUM(o.final_amount), 0) AS revenue " +
            "FROM \"Orders\" o " +
            "JOIN \"Users\" u ON u.user_id = o.user_id " +
            "WHERE o.paid_at >= DATE_TRUNC('month', CURRENT_DATE) " +
            "GROUP BY u.gender"
        );
        result.put("gender", genderStats);

        // 최근 90일 연령대별 주문
        List<Map<String, Object>> ageStats = jdbcTemplate.queryForList(
            "SELECT " +
            "  CASE " +
            "    WHEN EXTRACT(YEAR FROM AGE(u.birth)) < 20 THEN '10대' " +
            "    WHEN EXTRACT(YEAR FROM AGE(u.birth)) < 30 THEN '20대' " +
            "    WHEN EXTRACT(YEAR FROM AGE(u.birth)) < 40 THEN '30대' " +
            "    WHEN EXTRACT(YEAR FROM AGE(u.birth)) < 50 THEN '40대' " +
            "    ELSE '50대+' " +
            "  END AS age_group, " +
            "  COUNT(DISTINCT o.order_id) AS order_count " +
            "FROM \"Orders\" o " +
            "JOIN \"Users\" u ON u.user_id = o.user_id " +
            "WHERE o.paid_at >= CURRENT_DATE - INTERVAL '90 days' " +
            "  AND u.birth IS NOT NULL " +
            "GROUP BY age_group " +
            "ORDER BY age_group"
        );
        result.put("ageGroups", ageStats);

        return ApiResponse.success("인구통계 조회 성공", result);
    }
}