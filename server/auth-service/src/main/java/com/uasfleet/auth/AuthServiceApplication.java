package com.uasfleet.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * =============================================================================
 * Auth Service — Identity & Access Management (IAM) Entry Point
 * =============================================================================
 * This microservice handles all authentication and authorization concerns:
 *
 * RESPONSIBILITIES:
 *   1. User Registration — creating new user accounts with hashed passwords
 *   2. Authentication — validating credentials and issuing JWT tokens
 *   3. Token Validation — verifying JWT tokens for protected endpoints
 *   4. RBAC — Role-Based Access Control (ADMIN, OPERATOR, VIEWER)
 *
 * ARCHITECTURE (Clean Architecture layers):
 *   domain/entity/      → JPA entities (User, Role)
 *   domain/repository/  → Spring Data JPA repositories
 *   application/dto/    → Request/Response DTOs
 *   application/service/→ Business logic (AuthService, JwtService)
 *   adapter/web/        → REST controllers
 *   config/             → Security configuration beans
 *
 * SECURITY FLOW:
 *   1. Client sends POST /login with credentials
 *   2. Auth service validates credentials against database
 *   3. On success, returns a signed JWT token
 *   4. Client includes JWT in Authorization header for subsequent requests
 *   5. Other services validate the JWT (stateless authentication)
 *
 * PORT: 8081 (configured in application.yml)
 * DATABASE: auth_db (PostgreSQL)
 * =============================================================================
 */
@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
