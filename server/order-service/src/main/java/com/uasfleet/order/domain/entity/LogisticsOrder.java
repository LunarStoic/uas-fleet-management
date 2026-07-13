package com.uasfleet.order.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * =============================================================================
 * LogisticsOrder Entity — Delivery Order Transaction
 * =============================================================================
 * Maps to the 'logistics_order' table in order_db. Represents a single
 * delivery order with origin/destination coordinates, payload info, and
 * lifecycle status.
 *
 * ORDER LIFECYCLE (State Machine):
 *   PENDING → ROUTED → IN_TRANSIT → DELIVERED
 *   Additional terminal states: CANCELLED, FAILED
 *
 * CROSS-DB REFERENCE:
 *   assigned_uav_id is a logical reference to fleet_db.uav.id.
 *   No physical FK — validated via OpenFeign call to fleet-service.
 *
 * RELATIONSHIPS:
 *   logistics_order 1 ←→ N order_status_history
 *   logistics_order 1 ←→ 1 delivery_route
 * =============================================================================
 */
@Entity
@Table(name = "logistics_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogisticsOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", unique = true, nullable = false, length = 50)
    private String orderCode;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "assigned_uav_id")
    private Long assignedUavId;

    @Column(name = "origin_latitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal originLatitude;

    @Column(name = "origin_longitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal originLongitude;

    @Column(name = "origin_address", length = 255)
    private String originAddress;

    @Column(name = "dest_latitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal destLatitude;

    @Column(name = "dest_longitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal destLongitude;

    @Column(name = "dest_address", length = 255)
    private String destAddress;

    @Column(name = "payload_weight_kg", nullable = false, precision = 6, scale = 2)
    private BigDecimal payloadWeightKg;

    @Column(name = "payload_description", length = 255)
    private String payloadDescription;

    @Column(length = 10)
    @Builder.Default
    private String priority = "NORMAL";

    @Column(name = "requested_by", length = 100)
    private String requestedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private DeliveryRoute deliveryRoute;
}
