package com.uasfleet.fleet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * =============================================================================
 * MaintenanceLog Entity — UAV Maintenance Records
 * =============================================================================
 * Maps to the 'maintenance_log' table in fleet_db. Tracks all maintenance
 * activities for each UAV including scheduled inspections, repairs, etc.
 *
 * MAINTENANCE TYPES: SCHEDULED, UNSCHEDULED, REPAIR, INSPECTION
 * STATUS: COMPLETED, IN_PROGRESS, CANCELLED
 *
 * RELATIONSHIP: maintenance_log N ←→ 1 uav
 * =============================================================================
 */
@Entity
@Table(name = "maintenance_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uav_id", nullable = false)
    private Uav uav;

    @Column(name = "maintenance_type", nullable = false, length = 30)
    private String maintenanceType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    @Column(precision = 12, scale = 2)
    private BigDecimal cost;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "COMPLETED";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
