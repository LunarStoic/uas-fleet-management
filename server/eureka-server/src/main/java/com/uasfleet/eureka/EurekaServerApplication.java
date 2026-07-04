package com.uasfleet.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * =============================================================================
 * Eureka Server — Service Registry Entry Point
 * =============================================================================
 * This class bootstraps the Spring Cloud Netflix Eureka Server.
 *
 * WHAT IS A SERVICE REGISTRY?
 *   A service registry is a database of available service instances. In a
 *   microservices architecture, services need to find each other dynamically.
 *   When a service starts, it registers itself with Eureka (providing its
 *   host, port, and health status). Other services query Eureka to discover
 *   and communicate with registered services.
 *
 * ANNOTATIONS EXPLAINED:
 *   @SpringBootApplication — Combines @Configuration, @EnableAutoConfiguration,
 *       and @ComponentScan. This is the standard Spring Boot entry point.
 *   @EnableEurekaServer — Activates the embedded Eureka Server, which includes
 *       the service registry, dashboard UI, and REST API for registration.
 *
 * DASHBOARD:
 *   Once running, the Eureka dashboard is accessible at http://localhost:8761
 *   It shows all registered services, their status, and instance details.
 * =============================================================================
 */
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
