package com.uasfleet.order.domain.repository;

import com.uasfleet.order.domain.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * OrderStatusHistory Repository — Data Access for Status Audit Trail.
 */
@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

    /** Find all status changes for a specific order, ordered by time */
    List<OrderStatusHistory> findByOrderIdOrderByChangedAtDesc(Long orderId);
}
