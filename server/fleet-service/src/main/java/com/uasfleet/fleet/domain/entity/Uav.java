package com.uasfleet.fleet.domain.entity;

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
 * UAV Entity — Unmanned Aerial Vehicle Master Data
 * =============================================================================
 * Maps to the 'uav' table in fleet_db. Stores the complete registry of
 * all drones in the fleet including specifications, status, and location.
 *
 * STATUS LIFECYCLE:
 *   IDLE → IN_MISSION → IDLE (normal flight cycle)
 *   IDLE → MAINTENANCE → IDLE (scheduled maintenance)
 *   * → RETIRED (permanent decommission)
 *
 * RELATIONSHIPS:
 *   uav 1 ←→ N payload_spec
 *   uav 1 ←→ N maintenance_log
 * =============================================================================
 */
@Entity
@Table(name = "uav")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Uav {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "registration_code", unique = true, nullable = false, length = 50)
    private String registrationCode;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(nullable = false, length = 100)
    private String manufacturer;

    @Column(name = "serial_number", unique = true, nullable = false, length = 100)
    private String serialNumber;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "IDLE";

    @Column(name = "max_altitude_m", precision = 8, scale = 2)
    private BigDecimal maxAltitudeM;

    @Column(name = "max_speed_ms", precision = 6, scale = 2)
    private BigDecimal maxSpeedMs;

    @Column(name = "max_range_km", precision = 8, scale = 2)
    private BigDecimal maxRangeKm;

    @Column(name = "battery_capacity_wh", precision = 8, scale = 2)
    private BigDecimal batteryCapacityWh;

    @Column(name = "current_latitude", precision = 10, scale = 7)
    private BigDecimal currentLatitude;

    @Column(name = "current_longitude", precision = 10, scale = 7)
    private BigDecimal currentLongitude;

    @Column(name = "total_flight_hours", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalFlightHours = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    @OneToMany(mappedBy = "uav", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PayloadSpec> payloadSpecs = new ArrayList<>();

    @OneToMany(mappedBy = "uav", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MaintenanceLog> maintenanceLogs = new ArrayList<>();
}
