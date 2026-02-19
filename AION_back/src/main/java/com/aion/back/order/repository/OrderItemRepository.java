package com.aion.back.order.repository;

import com.aion.back.order.entity.Order;
import com.aion.back.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrder(Order order);
}
