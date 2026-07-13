package com.uasfleet.fleet.domain.repository;

import com.uasfleet.fleet.domain.entity.PayloadSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * PayloadSpec Repository — Data Access for Payload Specifications.
 */
@Repository
public interface PayloadSpecRepository extends JpaRepository<PayloadSpec, Long> {

    /** Find all payload specs for a specific UAV */
    List<PayloadSpec> findByUavId(Long uavId);
}
