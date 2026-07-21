package com.uasfleet.order.adapter.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

/**
 * =============================================================================
 * Fleet Service Feign Client — Declarative REST Client
 * =============================================================================
 * OpenFeign transforms this Java interface into a fully functional HTTP client
 * at runtime. No manual HTTP code (RestTemplate, WebClient) is needed.
 *
 * HOW IT WORKS:
 * 1. @FeignClient("fleet-service") tells Spring Cloud to look up the
 * "fleet-service" in Eureka's registry to find its network address.
 * 2. Each method maps to an HTTP endpoint on fleet-service.
 * 3. Spring Cloud handles: service discovery, load balancing, serialization,
 * error handling, and retry logic automatically.
 *
 * USAGE IN SERVICE LAYER:
 * 
 * @Autowired
 *            private FleetServiceClient fleetClient;
 *
 *            public void assignUav(Long orderId) {
 *            Map<String, Object> uav = fleetClient.getUavById(uavId);
 *            // Use UAV data for order assignment...
 *            }
 *
 *            WHY FEIGN OVER RESTTEMPLATE?
 *            - Declarative: Define the API contract as an interface, not
 *            imperative code
 *            - Integrated: Automatic Eureka discovery and client-side load
 *            balancing
 *            - Testable: Easy to mock in unit tests (just mock the interface)
 *            - Type-safe: Compile-time checks on method signatures
 *            =============================================================================
 */
@FeignClient(name = "fleet-service", // Logical name in Eureka registry
        path = "/uavs" // Base path prefix for all endpoints
)
public interface FleetServiceClient {

    /**
     * Fetches a specific UAV by its database ID.
     * Maps to: GET http://fleet-service/uavs/{id}
     *
     * @param id the UAV's unique identifier
     * @return UAV data as a Map (will be replaced with proper DTO later)
     */
    @GetMapping("/{id}")
    Map<String, Object> getUavById(@PathVariable("id") Long id);

    /**
     * Fetches all UAVs that are currently available for mission assignment.
     * Maps to: GET http://fleet-service/uavs/available
     *
     * @return list of available UAVs
     */
    @GetMapping("/available")
    List<Map<String, Object>> getAvailableUavs();
}
