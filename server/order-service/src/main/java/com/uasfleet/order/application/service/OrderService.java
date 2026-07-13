package com.uasfleet.order.application.service;

import com.uasfleet.order.application.dto.CreateOrderRequest;
import com.uasfleet.order.domain.entity.LogisticsOrder;
import com.uasfleet.order.domain.entity.OrderStatusHistory;
import com.uasfleet.order.domain.repository.LogisticsOrderRepository;
import com.uasfleet.order.domain.repository.OrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * =============================================================================
 * Order Service — Logistics Order Business Logic
 * =============================================================================
 * Manages the complete lifecycle of delivery orders:
 *   - Create orders with auto-generated order codes
 *   - List and retrieve orders
 *   - Update order status with audit trail
 *
 * ORDER CODE FORMAT: ORD-YYYYMMDD-NNNN (e.g., ORD-20260704-0001)
 *
 * FUTURE INTEGRATION:
 *   - After creating an order, publish to RabbitMQ for route optimization
 *   - Before assigning UAV, validate via OpenFeign to fleet-service
 * =============================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final LogisticsOrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;

    /**
     * Retrieves all orders, sorted by creation date descending.
     */
    @Transactional(readOnly = true)
    public List<LogisticsOrder> getAllOrders() {
        log.debug("Fetching all logistics orders");
        return orderRepository.findAll();
    }

    /**
     * Retrieves a specific order by ID.
     */
    @Transactional(readOnly = true)
    public LogisticsOrder getOrderById(Long id) {
        log.debug("Fetching order with id: {}", id);
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    /**
     * Creates a new logistics order with an auto-generated order code.
     * Initial status is PENDING. An audit record is created in the
     * status history table.
     *
     * @param request the order creation payload from the client
     * @return the saved order entity
     */
    @Transactional
    public LogisticsOrder createOrder(CreateOrderRequest request) {
        // Generate unique order code: ORD-YYYYMMDD-NNNN
        String orderCode = generateOrderCode();

        LogisticsOrder order = LogisticsOrder.builder()
                .orderCode(orderCode)
                .status("PENDING")
                .originLatitude(request.getOriginLatitude())
                .originLongitude(request.getOriginLongitude())
                .originAddress(request.getOriginAddress())
                .destLatitude(request.getDestLatitude())
                .destLongitude(request.getDestLongitude())
                .destAddress(request.getDestAddress())
                .payloadWeightKg(request.getPayloadWeightKg())
                .payloadDescription(request.getPayloadDescription())
                .priority(request.getPriority() != null ? request.getPriority() : "NORMAL")
                .build();

        LogisticsOrder savedOrder = orderRepository.save(order);
        log.info("Created new order: {} (id: {})", orderCode, savedOrder.getId());

        // Record initial status in audit trail
        recordStatusChange(savedOrder, null, "PENDING", "system", "Order created");

        return savedOrder;
    }

    /**
     * Updates the status of an existing order and records the transition
     * in the audit trail.
     *
     * @param orderId   the order ID
     * @param newStatus the new status to transition to
     * @return the updated order
     */
    @Transactional
    public LogisticsOrder updateOrderStatus(Long orderId, String newStatus) {
        LogisticsOrder order = getOrderById(orderId);
        String previousStatus = order.getStatus();

        order.setStatus(newStatus);
        LogisticsOrder updatedOrder = orderRepository.save(order);
        log.info("Order {} status changed: {} → {}", order.getOrderCode(), previousStatus, newStatus);

        // Record status transition in audit trail
        recordStatusChange(updatedOrder, previousStatus, newStatus, "system", null);

        return updatedOrder;
    }

    // -------------------------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------------------------

    /**
     * Generates a unique order code in format: ORD-YYYYMMDD-NNNN
     */
    private String generateOrderCode() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long todayCount = orderRepository.count() + 1;
        return String.format("ORD-%s-%04d", datePrefix, todayCount);
    }

    /**
     * Records a status change in the order_status_history table.
     */
    private void recordStatusChange(LogisticsOrder order, String previousStatus,
                                     String newStatus, String changedBy, String reason) {
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .reason(reason)
                .changedAt(LocalDateTime.now())
                .build();
        statusHistoryRepository.save(history);
    }
}
