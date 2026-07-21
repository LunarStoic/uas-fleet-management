package com.uasfleet.fleet.application.service;

import com.uasfleet.fleet.application.dto.CreateUavRequest;
import com.uasfleet.fleet.domain.entity.Uav;
import com.uasfleet.fleet.domain.repository.UavRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * =============================================================================
 * Fleet Service — UAV Business Logic
 * =============================================================================
 * Handles all business operations related to UAV fleet management.
 * Called by the UavController (REST) and consumed by other services
 * via OpenFeign (e.g., order-service checks UAV availability).
 *
 * OPERATIONS:
 * - List all UAVs
 * - Get UAV by ID
 * - Find available (IDLE) UAVs for mission assignment
 * =============================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FleetService {

    private final UavRepository uavRepository;

    /**
     * Retrieves all registered UAVs in the fleet.
     */
    public List<Uav> getAllUavs() {
        log.debug("Fetching all UAVs");
        return uavRepository.findAll();
    }

    /**
     * Retrieves a specific UAV by its database ID.
     *
     * @param id the UAV ID
     * @return the UAV entity
     * @throws RuntimeException if not found
     */
    public Uav getUavById(Long id) {
        log.debug("Fetching UAV with id: {}", id);
        return uavRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("UAV not found with id: " + id));
    }

    /**
     * Retrieves all UAVs currently available for mission assignment.
     * Available = status is IDLE.
     */
    public List<Uav> getAvailableUavs() {
        log.debug("Fetching available (IDLE) UAVs");
        return uavRepository.findByStatus("IDLE");
    }

    /**
     * Registers a new UAV in the fleet.
     * Initial status is always IDLE.
     *
     * @param request validated UAV registration payload
     * @return the persisted UAV entity
     */
    @Transactional
    public Uav createUav(CreateUavRequest request) {
        Uav uav = Uav.builder()
                .registrationCode(request.getRegistrationCode())
                .model(request.getModel())
                .manufacturer(request.getManufacturer())
                .serialNumber(request.getSerialNumber())
                .maxAltitudeM(request.getMaxAltitudeM())
                .maxSpeedMs(request.getMaxSpeedMs())
                .maxRangeKm(request.getMaxRangeKm())
                .batteryCapacityWh(request.getBatteryCapacityWh())
                .currentLatitude(request.getCurrentLatitude())
                .currentLongitude(request.getCurrentLongitude())
                .status("IDLE")
                .build();

        Uav saved = uavRepository.save(uav);
        log.info("Registered new UAV: {} (id: {})", saved.getRegistrationCode(), saved.getId());
        return saved;
    }

    /**
     * Transitions a UAV to a new operational status.
     * Used by the dispatch pipeline (e.g., IDLE → IN_MISSION → IDLE).
     *
     * @param id        the UAV database ID
     * @param newStatus the target status (IDLE, IN_MISSION, MAINTENANCE, RETIRED)
     * @return the updated UAV entity
     */
    @Transactional
    public Uav updateUavStatus(Long id, String newStatus) {
        Uav uav = getUavById(id);
        String prev = uav.getStatus();
        uav.setStatus(newStatus);
        Uav saved = uavRepository.save(uav);
        log.info("UAV {} status changed: {} → {}", uav.getRegistrationCode(), prev, newStatus);
        return saved;
    }
}
