package com.uasfleet.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * =============================================================================
 * API Gateway — Single Entry Point for All Client Requests
 * =============================================================================
 * This class bootstraps the Spring Cloud Gateway application.
 *
 * WHAT IS AN API GATEWAY?
 *   An API Gateway sits between the client (frontend) and the backend
 *   microservices. All requests flow through the gateway, which routes
 *   them to the correct service based on the URL path.
 *
 * REQUEST FLOW:
 *   Client → API Gateway (port 8080)
 *     → /api/auth/**    → auth-service    (port 8081)
 *     → /api/fleet/**   → fleet-service   (port 8082)
 *     → /api/orders/**  → order-service   (port 8083)
 *     → /api/reports/** → report-service  (port 8084)
 *
 * INTEGRATION WITH EUREKA:
 *   The gateway uses the Eureka Discovery Client to resolve logical service
 *   names (e.g., "fleet-service") to actual network locations. The 'lb://'
 *   scheme in route configuration enables client-side load balancing when
 *   multiple instances of a service are running.
 *
 * NOTE: Unlike other Spring Boot services in this project, the gateway uses
 *   Spring WebFlux (reactive) instead of Spring MVC (servlet). This means
 *   it handles requests asynchronously and non-blocking — ideal for a
 *   proxy/routing service that mostly forwards requests.
 * =============================================================================
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
