package com.uasfleet.order.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * =============================================================================
 * UpdateStatusRequest DTO — Order Status Update Payload
 * =============================================================================
 * Used by PATCH /orders/{id}/status endpoint.
 * Contains the new status value to transition to.
 * =============================================================================
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;
}
