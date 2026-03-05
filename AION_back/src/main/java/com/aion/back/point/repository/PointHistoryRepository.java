package com.aion.back.point.repository;

import com.aion.back.point.entity.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Points_History 테이블 Repository
 *
 * Member PK 필드명이 userId 이므로
 * Spring Data JPA 메서드명도 MemberUserId 기준으로 작성해야 합니다.
 */
public interface PointHistoryRepository extends JpaRepository<Point, Long> {

    // 특정 회원의 포인트 내역 최신순 조회
    // member.userId → By Member_UserId or JPQL로 처리
    @Query("SELECT p FROM Point p WHERE p.member.userId = :userId ORDER BY p.createdAt DESC")
    List<Point> findByMemberUserId(@Param("userId") Long userId);

    // 특정 주문과 연관된 포인트 내역 조회
    List<Point> findByRelatedOrderId(Long orderId);

    // 특정 회원의 사용 가능한 포인트 내역 조회
    @Query("SELECT p FROM Point p WHERE p.member.userId = :userId AND p.status = :status ORDER BY p.createdAt DESC")
    List<Point> findByMemberUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") Point.PointStatus status
    );

    // 잔액 재계산용 집계 쿼리
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Point p WHERE p.member.userId = :userId")
    int sumAmountByMemberUserId(@Param("userId") Long userId);
}