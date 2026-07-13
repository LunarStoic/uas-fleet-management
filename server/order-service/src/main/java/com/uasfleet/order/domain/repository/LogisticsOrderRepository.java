package com.uasfleet.order.domain.repository;

import com.uasfleet.order.domain.entity.LogisticsOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * LogisticsOrder Repository — Data Access for Delivery Orders.
 */
@Repository
public interface LogisticsOrderRepository extends JpaRepository<LogisticsOrder, Long> {

    /** Find all orders with a specific status */
    List<LogisticsOrder> findByStatus(String status);

    /** Find all orders assigned to a specific UAV */
    List<LogisticsOrder> findByAssignedUavId(Long uavId);
}
