package com.uasfleet.report.adapter.web;

import com.uasfleet.report.application.service.ReportService;
import com.uasfleet.report.domain.entity.FlightRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * =============================================================================
 * Flight Controller — Flight History REST API
 * =============================================================================
 * Exposes flight record endpoints consumed by the Logbook page via API Gateway.
 *
 * REQUEST FLOW:
 *   Client → GET /api/reports/flights → Gateway strips /api/reports → GET /flights
 *
 * ENDPOINTS:
 *   GET /flights       — List all flight records
 *   GET /flights?uavId — Filter flights by UAV ID
 * =============================================================================
 */
@RestController
@RequestMapping("/flights")
@RequiredArgsConstructor
public class FlightController {

    private final ReportService reportService;

    /**
     * List all flight records, optionally filtered by UAV ID.
     * Used by Logbook page (GET /api/reports/flights).
     */
    @GetMapping
    public ResponseEntity<List<FlightRecord>> getFlights(
            @RequestParam(required = false) String uavId) {
        if (uavId != null && !uavId.isBlank()) {
            return ResponseEntity.ok(reportService.getFlightsByUavId(uavId));
        }
        return ResponseEntity.ok(reportService.getAllFlights());
    }
}
