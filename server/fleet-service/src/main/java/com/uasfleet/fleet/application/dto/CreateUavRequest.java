package com.uasfleet.fleet.application.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * =============================================================================
 * CreateUavRequest — DTO for UAV Registration
 * =============================================================================
 * Carries the validated payload from the client when registering a new UAV.
 * Used by UavController.createUav() → FleetService.createUav().
 *
 * VALIDATION:
 * All mandatory fields are annotated with @NotBlank / @NotNull.
 * Optional specs (altitude, speed, range, battery) and location
 * fields are not required on first registration but are strongly
 * recommended for dispatch eligibility.
 * =============================================================================
 */
@Data
public class CreateUavRequest {

    @NotBlank(message = "Registration code is required")
    @Size(max = 50, message = "Registration code must be at most 50 characters")
    private String registrationCode;

    @NotBlank(message = "Model is required")
    @Size(max = 100, message = "Model must be at most 100 characters")
    private String model;

    @NotBlank(message = "Manufacturer is required")
    @Size(max = 100, message = "Manufacturer must be at most 100 characters")
    private String manufacturer;

    @NotBlank(message = "Serial number is required")
    @Size(max = 100, message = "Serial number must be at most 100 characters")
    private String serialNumber;

    /** Maximum operating altitude in meters */
    @DecimalMin(value = "0.0", inclusive = false, message = "Max altitude must be positive")
    private BigDecimal maxAltitudeM;

    /** Maximum speed in m/s */
    @DecimalMin(value = "0.0", inclusive = false, message = "Max speed must be positive")
    private BigDecimal maxSpeedMs;

    /** Maximum range in kilometers */
    @DecimalMin(value = "0.0", inclusive = false, message = "Max range must be positive")
    private BigDecimal maxRangeKm;

    /** Battery capacity in Watt-hours */
    @DecimalMin(value = "0.0", inclusive = false, message = "Battery capacity must be positive")
    private BigDecimal batteryCapacityWh;

    /** GPS latitude of home/base location */
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private BigDecimal currentLatitude;

    /** GPS longitude of home/base location */
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private BigDecimal currentLongitude;
}
