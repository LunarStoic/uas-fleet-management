package com.uasfleet.report;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * =============================================================================
 * Report Service — Flight History & Operational Analytics Entry Point
 * =============================================================================
 * This microservice provides reporting and analytics capabilities for the
 * UAS fleet management system.
 *
 * RESPONSIBILITIES:
 *   1. Flight History — records of all completed/failed delivery flights
 *   2. Operational KPIs — delivery success rate, average flight time, etc.
 *   3. Fleet Utilization — UAV usage statistics and efficiency metrics
 *   4. Period Reports — daily, weekly, monthly operational summaries
 *
 * ARCHITECTURE (Clean Architecture layers):
 *   domain/entity/      → JPA entities (FlightRecord, OperationalSummary)
 *   domain/repository/  → Spring Data JPA repositories
 *   application/dto/    → Request/Response DTOs
 *   application/service/→ Business logic (ReportService, AnalyticsService)
 *   adapter/web/        → REST controllers
 *   config/             → Configuration beans
 *
 * DATA FLOW:
 *   This service is primarily READ-HEAVY. It stores historical data
 *   that is populated either by:
 *     - Direct writes from other services (event-driven, future)
 *     - Periodic data sync / ETL processes
 *     - Manual data import
 *
 * PORT: 8084 (configured in application.yml)
 * DATABASE: report_db (PostgreSQL)
 * =============================================================================
 */
@SpringBootApplication
public class ReportServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReportServiceApplication.class, args);
    }
}
