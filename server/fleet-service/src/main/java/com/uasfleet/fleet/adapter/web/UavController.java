package com.uasfleet.fleet.adapter.web;

import com.uasfleet.fleet.application.dto.CreateUavRequest;
import com.uasfleet.fleet.application.service.FleetService;
import com.uasfleet.fleet.domain.entity.Uav;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * =============================================================================
 * UAV Controller — Fleet REST API
 * =============================================================================
 * Exposes UAV fleet data via REST endpoints. This controller is consumed by:
 *
 * 1. Client (React) via API Gateway:
 * Client → GET /api/fleet/uavs → Gateway strips /api/fleet → GET /uavs
 *
 * 2. Order Service via OpenFeign:
 * @FeignClient(name="fleet-service", path="/uavs")
 * → GET /uavs/{id}
 * → GET /uavs/available
 *
 * ENDPOINTS:
 * GET /uavs — List all UAVs
 * GET /uavs/{id} — Get UAV by ID
 * GET /uavs/available — Get available (IDLE) UAVs
 * =============================================================================
 */
@RestController
@RequestMapping("/uavs")
@RequiredArgsConstructor
public class UavController {

    private final FleetService fleetService;

    /**
     * List all UAVs in the fleet.
     * Used by FleetConfig page to render the drone card grid.
     */
    @GetMapping
    public ResponseEntity<List<Uav>> getAllUavs() {
        return ResponseEntity.ok(fleetService.getAllUavs());
    }

    /**
     * Get a specific UAV by its database ID.
     * Used by order-service (via OpenFeign) to fetch UAV details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Uav> getUavById(@PathVariable Long id) {
        return ResponseEntity.ok(fleetService.getUavById(id));
    }

    /**
     * Get all UAVs available for mission assignment (status = IDLE).
     * Used by order-service (via OpenFeign) and dispatch-engine.
     */
    @GetMapping("/available")
    public ResponseEntity<List<Uav>> getAvailableUavs() {
        return ResponseEntity.ok(fleetService.getAvailableUavs());
    }

    /**
     * Register a new UAV in the fleet.
     * Used by the React FleetConfig page via RegisterUavModal.
     */
    @PostMapping
    public ResponseEntity<Uav> createUav(@Valid @RequestBody CreateUavRequest request) {
        Uav created = fleetService.createUav(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update the operational status of a UAV.
     * Used by the dispatch pipeline to transition: IDLE -> IN_MISSION -> IDLE.
     *
     * Request body: { "status": "IN_MISSION" }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Uav> updateUavStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(fleetService.updateUavStatus(id, newStatus));
    }
}
