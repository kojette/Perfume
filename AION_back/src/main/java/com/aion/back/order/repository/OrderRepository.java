package com.aion.back.order.repository;

import com.aion.back.member.entity.Member;
import com.aion.back.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByMemberOrderByCreatedAtDesc(Member member);

}
