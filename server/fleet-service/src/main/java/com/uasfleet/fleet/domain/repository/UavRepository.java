package com.uasfleet.fleet.domain.repository;

import com.uasfleet.fleet.domain.entity.Uav;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * =============================================================================
 * UAV Repository — Data Access Layer
 * =============================================================================
 * Spring Data JPA auto-generates the implementation at runtime.
 * Custom query methods follow Spring Data naming conventions.
 * =============================================================================
 */
@Repository
public interface UavRepository extends JpaRepository<Uav, Long> {

    /** Find all UAVs with a specific operational status */
    List<Uav> findByStatus(String status);

    /** Find UAV by registration code */
    Optional<Uav> findByRegistrationCode(String registrationCode);
}
