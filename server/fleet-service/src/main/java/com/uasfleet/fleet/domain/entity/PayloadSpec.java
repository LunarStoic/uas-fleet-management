package com.uasfleet.fleet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * =============================================================================
 * PayloadSpec Entity — UAV Payload Specifications
 * =============================================================================
 * Maps to the 'payload_spec' table in fleet_db. Each UAV can have multiple
 * payload configurations (e.g., parcel, medical, hazmat).
 *
 * CARGO TYPES: PARCEL, MEDICAL, FOOD, HAZMAT, OTHER
 *
 * RELATIONSHIP: payload_spec N ←→ 1 uav
 * =============================================================================
 */
@Entity
@Table(name = "payload_spec")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayloadSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uav_id", nullable = false)
    private Uav uav;

    @Column(name = "max_weight_kg", nullable = false, precision = 6, scale = 2)
    private BigDecimal maxWeightKg;

    @Column(name = "cargo_type", nullable = false, length = 50)
    private String cargoType;

    @Column(name = "volume_cm3", precision = 10, scale = 2)
    private BigDecimal volumeCm3;

    @Column(name = "is_temperature_controlled")
    @Builder.Default
    private Boolean isTemperatureControlled = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
