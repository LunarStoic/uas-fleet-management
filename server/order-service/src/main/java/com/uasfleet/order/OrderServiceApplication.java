package com.uasfleet.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * =============================================================================
 * Order Service — Logistics Order Lifecycle Management Entry Point
 * =============================================================================
 * This microservice manages the complete lifecycle of logistics delivery orders.
 *
 * ORDER LIFECYCLE (State Machine):
 *   PENDING → ROUTED → IN_TRANSIT → DELIVERED
 *     │         │         │            │
 *     │         │         │            └─ Order completed, cargo delivered
 *     │         │         └─ UAV is flying the delivery route
 *     │         └─ Route optimized by dispatch-engine, UAV assigned
 *     └─ Order created, awaiting route optimization
 *
 *   Additional states: CANCELLED, FAILED (terminal states)
 *
 * INTEGRATION POINTS:
 *   1. fleet-service (SYNCHRONOUS via OpenFeign)
 *      → Checks UAV availability and assigns a drone to an order
 *      → Uses @FeignClient interface for declarative REST calls
 *
 *   2. dispatch-engine (ASYNCHRONOUS via RabbitMQ)
 *      → Publishes route optimization requests to 'route_optimization_queue'
 *      → Python service consumes and solves VRP (Vehicle Routing Problem)
 *      → Results are sent back via a response queue
 *
 * ANNOTATIONS:
 *   @EnableFeignClients — scans for @FeignClient interfaces and creates
 *       proxy implementations that handle HTTP calls, service discovery,
 *       circuit breaking, and load balancing automatically.
 *
 * PORT: 8083 (configured in application.yml)
 * DATABASE: order_db (PostgreSQL)
 * =============================================================================
 */
@SpringBootApplication
@EnableFeignClients
public class OrderServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
