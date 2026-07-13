package com.uasfleet.order.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * =============================================================================
 * CreateOrderRequest DTO — New Order Payload
 * =============================================================================
 * Matches the form fields in the React CreateOrderModal component.
 * Validated before processing in OrderService.
 * =============================================================================
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {

    @NotNull(message = "Origin latitude is required")
    private BigDecimal originLatitude;

    @NotNull(message = "Origin longitude is required")
    private BigDecimal originLongitude;

    private String originAddress;

    @NotNull(message = "Destination latitude is required")
    private BigDecimal destLatitude;

    @NotNull(message = "Destination longitude is required")
    private BigDecimal destLongitude;

    private String destAddress;

    @NotNull(message = "Payload weight is required")
    @DecimalMin(value = "0.1", message = "Payload weight must be at least 0.1 kg")
    private BigDecimal payloadWeightKg;

    private String payloadDescription;

    @Builder.Default
    private String priority = "NORMAL";
}
