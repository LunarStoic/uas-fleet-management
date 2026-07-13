package com.uasfleet.fleet.domain.repository;

import com.uasfleet.fleet.domain.entity.MaintenanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * MaintenanceLog Repository — Data Access for Maintenance Records.
 */
@Repository
public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, Long> {

    /** Find all maintenance logs for a specific UAV */
    List<MaintenanceLog> findByUavId(Long uavId);
}
