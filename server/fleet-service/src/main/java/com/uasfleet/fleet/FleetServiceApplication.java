package com.uasfleet.fleet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * =============================================================================
 * Fleet Service — UAV Master Data Management Entry Point
 * =============================================================================
 * This microservice is the single source of truth for all UAV fleet data.
 *
 * RESPONSIBILITIES:
 *   1. UAV Registry — CRUD operations for drone vehicles
 *   2. Payload Management — payload types, capacities, and compatibility
 *   3. Maintenance Tracking — service logs, scheduled maintenance, alerts
 *   4. Fleet Status — real-time status of each UAV (AVAILABLE, IN_MISSION,
 *      MAINTENANCE, DECOMMISSIONED)
 *
 * ARCHITECTURE (Clean Architecture layers):
 *   domain/entity/      → JPA entities (UavVehicle, MaintenanceLog, etc.)
 *   domain/repository/  → Spring Data JPA repositories
 *   application/dto/    → Request/Response DTOs
 *   application/service/→ Business logic (FleetService, MaintenanceService)
 *   adapter/web/        → REST controllers
 *   config/             → Configuration beans
 *
 * CONSUMED BY:
 *   - order-service (via OpenFeign) — checks UAV availability before assignment
 *   - report-service — fetches fleet data for operational reports
 *   - dispatch-engine — queries available UAVs for route optimization
 *
 * PORT: 8082 (configured in application.yml)
 * DATABASE: fleet_db (PostgreSQL)
 * =============================================================================
 */
@SpringBootApplication
public class FleetServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FleetServiceApplication.class, args);
    }
}
