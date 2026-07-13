package com.uasfleet.order.domain.repository;

import com.uasfleet.order.domain.entity.DeliveryRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * DeliveryRoute Repository — Data Access for Optimized Routes.
 */
@Repository
public interface DeliveryRouteRepository extends JpaRepository<DeliveryRoute, Long> {

    /** Find delivery route by order ID */
    Optional<DeliveryRoute> findByOrderId(Long orderId);
}
