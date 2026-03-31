package com.aion.back.point.repository;
import com.aion.back.point.entity.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface PointHistoryRepository extends JpaRepository<Point, Long> {

    @Query("SELECT p FROM Point p WHERE p.member.userId = :userId ORDER BY p.createdAt DESC")
    List<Point> findByMemberUserId(@Param("userId") Long userId);
    List<Point> findByRelatedOrderId(Long orderId);

    @Query("SELECT p FROM Point p WHERE p.member.userId = :userId AND p.status = :status ORDER BY p.createdAt DESC")
    List<Point> findByMemberUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") Point.PointStatus status
    );

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Point p WHERE p.member.userId = :userId")
    int sumAmountByMemberUserId(@Param("userId") Long userId);
}