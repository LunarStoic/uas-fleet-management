package com.uasfleet.order.adapter.web;

import com.uasfleet.order.application.dto.CreateOrderRequest;
import com.uasfleet.order.application.dto.UpdateStatusRequest;
import com.uasfleet.order.application.service.OrderService;
import com.uasfleet.order.domain.entity.LogisticsOrder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * =============================================================================
 * Order Controller — Logistics Order REST API
 * =============================================================================
 * Exposes order CRUD endpoints consumed by the React client via API Gateway.
 *
 * REQUEST FLOW:
 *   Client → GET /api/orders → Gateway strips /api/orders → GET /
 *   Client → POST /api/orders → Gateway strips /api/orders → POST /
 *   Client → PATCH /api/orders/{id}/status → Gateway → PATCH /{id}/status
 *
 * ENDPOINTS:
 *   GET    /            — List all orders
 *   GET    /{id}        — Get order by ID
 *   POST   /            — Create new order
 *   PATCH  /{id}/status — Update order status
 * =============================================================================
 */
@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * List all logistics orders.
     * Used by OrderLogistics page and useOrderStore.fetchOrders().
     */
    @GetMapping
    public ResponseEntity<List<LogisticsOrder>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /**
     * Get a specific order by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<LogisticsOrder> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /**
     * Create a new logistics delivery order.
     * Used by useOrderStore.createOrder() from the CreateOrderModal form.
     */
    @PostMapping
    public ResponseEntity<LogisticsOrder> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        LogisticsOrder created = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update the status of an existing order.
     * Used by useOrderStore.updateOrderStatus() for lifecycle transitions.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<LogisticsOrder> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        LogisticsOrder updated = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }
}
