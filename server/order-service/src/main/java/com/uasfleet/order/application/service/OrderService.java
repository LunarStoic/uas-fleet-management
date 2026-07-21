package com.uasfleet.order.application.service;

import com.uasfleet.order.application.dto.CreateOrderRequest;
import com.uasfleet.order.domain.entity.LogisticsOrder;
import com.uasfleet.order.domain.entity.OrderStatusHistory;
import com.uasfleet.order.domain.repository.LogisticsOrderRepository;
import com.uasfleet.order.domain.repository.OrderStatusHistoryRepository;
import com.uasfleet.order.adapter.client.FleetServiceClient;
import com.uasfleet.order.infrastructure.messaging.RouteOptimizationPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * =============================================================================
 * Order Service — Logistics Order Business Logic
 * =============================================================================
 * Manages the complete lifecycle of delivery orders:
 * - Create orders with auto-generated order codes
 * - List and retrieve orders
 * - Update order status with audit trail
 *
 * ORDER CODE FORMAT: ORD-YYYYMMDD-NNNN (e.g., ORD-20260704-0001)
 *
 * FUTURE INTEGRATION:
 * - After creating an order, publish to RabbitMQ for route optimization
 * - Before assigning UAV, validate via OpenFeign to fleet-service
 * =============================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final LogisticsOrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final RouteOptimizationPublisher routePublisher;
    private final FleetServiceClient fleetServiceClient;

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

    /**
     * Triggers the dispatch pipeline for a PENDING order.
     *
     * Steps:
     * 1. Validate the order exists and is PENDING
     * 2. Check that at least one IDLE UAV is available via FleetServiceClient
     * 3. Publish a route optimization message to RabbitMQ
     * 4. Transition order status to DISPATCHING
     *
     * @param orderId the ID of the PENDING order to dispatch
     * @return the updated order (now DISPATCHING)
     * @throws IllegalStateException if order is not PENDING or no UAVs available
     */
    @Transactional
    public LogisticsOrder generateRoute(Long orderId) {
        LogisticsOrder order = getOrderById(orderId);

        // 1. Validate state
        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException(
                    "Order " + order.getOrderCode() + " is not PENDING (current: " + order.getStatus() + ")");
        }

        // 2. Check UAV availability
        var availableUavs = fleetServiceClient.getAvailableUavs();
        if (availableUavs == null || availableUavs.isEmpty()) {
            throw new IllegalStateException("No IDLE UAVs available for dispatch");
        }
        log.info("Found {} available UAV(s) for Order {}", availableUavs.size(), order.getOrderCode());

        // 3. Publish to RabbitMQ for the dispatch-engine
        Map<String, Object> message = new HashMap<>();
        message.put("orderId", order.getId());
        message.put("orderCode", order.getOrderCode());
        message.put("origin", Map.of(
                "lat", order.getOriginLatitude(),
                "lng", order.getOriginLongitude()));
        message.put("destination", Map.of(
                "lat", order.getDestLatitude(),
                "lng", order.getDestLongitude()));
        message.put("payloadWeight", order.getPayloadWeightKg());
        message.put("priority", order.getPriority());

        routePublisher.publishOptimizationRequest(message);
        log.info("Route optimization message published for Order {}", order.getOrderCode());

        // 4. Transition order status
        return updateOrderStatus(orderId, "DISPATCHING");
    }

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
