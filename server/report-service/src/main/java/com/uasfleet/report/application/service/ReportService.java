package com.uasfleet.report.application.service;

import com.uasfleet.report.domain.entity.FlightRecord;
import com.uasfleet.report.domain.repository.FlightRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * =============================================================================
 * Report Service — Flight History Business Logic
 * =============================================================================
 * Provides access to historical flight data for reporting and analytics.
 * =============================================================================
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportService {

    private final FlightRecordRepository flightRecordRepository;

    /**
     * Retrieves all flight records, sorted by date descending.
     */
    public List<FlightRecord> getAllFlights() {
        log.debug("Fetching all flight records");
        return flightRecordRepository.findAllByOrderByDateDesc();
    }

    /**
     * Retrieves flight records for a specific UAV.
     */
    public List<FlightRecord> getFlightsByUavId(String uavId) {
        log.debug("Fetching flights for UAV: {}", uavId);
        return flightRecordRepository.findByUavId(uavId);
    }
}
