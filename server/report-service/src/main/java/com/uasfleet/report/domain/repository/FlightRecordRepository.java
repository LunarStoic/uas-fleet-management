package com.uasfleet.report.domain.repository;

import com.uasfleet.report.domain.entity.FlightRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * FlightRecord Repository — Data Access for Flight History.
 */
@Repository
public interface FlightRecordRepository extends JpaRepository<FlightRecord, Long> {

    /** Find all flights for a specific UAV */
    List<FlightRecord> findByUavId(String uavId);

    /** Find all flights ordered by date descending */
    List<FlightRecord> findAllByOrderByDateDesc();
}
