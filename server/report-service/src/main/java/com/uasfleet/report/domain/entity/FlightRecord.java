package com.uasfleet.report.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * =============================================================================
 * FlightRecord Entity — Historical Flight Data
 * =============================================================================
 * Maps to the 'flight_record' table in report_db. Stores completed flight
 * history data for operational analytics and the Logbook page.
 *
 * POPULATED BY:
 *   - Batch import from telemetry data after missions complete
 *   - Manual entry for legacy/historical flights
 *
 * CONSUMED BY:
 *   - Logbook page (GET /reports/flights → GET /flights)
 *   - Operational dashboards and reports
 * =============================================================================
 */
@Entity
@Table(name = "flight_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlightRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uav_id", nullable = false, length = 50)
    private String uavId;

    @Column(name = "mission_type", length = 50)
    @Builder.Default
    private String missionType = "Standard";

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "duration_min", precision = 8, scale = 2)
    private BigDecimal durationMin;

    @Column(name = "distance_km", precision = 8, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "max_altitude_m", precision = 8, scale = 2)
    private BigDecimal maxAltitudeM;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
