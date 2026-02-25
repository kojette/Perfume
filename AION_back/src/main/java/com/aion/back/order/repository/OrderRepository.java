package com.aion.back.order.repository;

import com.aion.back.member.entity.Member;
import com.aion.back.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Map;

import com.aion.back.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Modifying
    @Query(value = "UPDATE \"Users\" SET total_points = COALESCE(total_points, 0) + :points WHERE email = :email", nativeQuery = true)
    void updateTotalPoints(@Param("email") String email, @Param("points") int points);

    @Modifying
    @Query(value = "INSERT INTO \"UserPoints\" (user_email, points, description, action_type, created_at) VALUES (:email, :points, :description, :actionType, CURRENT_TIMESTAMP)", nativeQuery = true)
    void insertPointHistory(@Param("email") String email, @Param("points") int points, @Param("description") String description, @Param("actionType") String actionType);

    @Query(value = "SELECT id, user_email, points, description, action_type, created_at FROM \"UserPoints\" WHERE user_email = :email ORDER BY created_at DESC", nativeQuery = true)
    List<Map<String, Object>> findPointsByEmail(@Param("email") String email);

    List<Order> findByMemberOrderByCreatedAtDesc(Member member);

}
