package com.uasfleet.order.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * =============================================================================
 * OrderStatusHistory Entity — Audit Trail for Status Changes
 * =============================================================================
 * Maps to the 'order_status_history' table in order_db. Every status
 * transition creates an immutable audit record for compliance and debugging.
 *
 * EXAMPLE:
 *   Order #123: PENDING → ROUTED (changed_by: "dispatch-engine")
 *   Order #123: ROUTED → IN_TRANSIT (changed_by: "system")
 *
 * RELATIONSHIP: order_status_history N ←→ 1 logistics_order
 * =============================================================================
 */
@Entity
@Table(name = "order_status_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private LogisticsOrder order;

    @Column(name = "previous_status", length = 20)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 20)
    private String newStatus;

    @Column(name = "changed_by", length = 100)
    private String changedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "changed_at", nullable = false)
    @Builder.Default
    private LocalDateTime changedAt = LocalDateTime.now();
}
