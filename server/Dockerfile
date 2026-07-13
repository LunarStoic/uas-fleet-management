# =============================================================================
# Dockerfile — Java Microservices (Multi-Stage Build)
# =============================================================================
# Stage 1 (builder): Gradle build inside a JDK container with full toolchain.
# Stage 2 (runtime): Minimal JRE-only image (~200MB vs ~800MB full JDK).
#
# BUILD CONTEXT: Must be run from the server/ directory so Gradle can resolve
# all subproject dependencies.
#
# USAGE:
#   docker build --build-arg SERVICE_NAME=eureka-server -t uas-eureka -f Dockerfile .
# =============================================================================

# ---- Stage 1: Build ----
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Gradle wrapper + build files first (Docker layer caching)
COPY gradlew gradlew
COPY gradle/ gradle/
COPY build.gradle build.gradle
COPY settings.gradle settings.gradle

# Copy all subprojects (needed for dependency resolution)
COPY eureka-server/ eureka-server/
COPY api-gateway/ api-gateway/
COPY auth-service/ auth-service/
COPY fleet-service/ fleet-service/
COPY order-service/ order-service/
COPY report-service/ report-service/

# Make Gradle wrapper executable
RUN chmod +x gradlew

# Build argument: which service to build
ARG SERVICE_NAME

# Build only the target service (skip tests for faster builds)
RUN ./gradlew :${SERVICE_NAME}:bootJar -x test --no-daemon

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser

# Build argument: which service jar to copy
ARG SERVICE_NAME

# Copy the built JAR from builder stage
COPY --from=builder /app/${SERVICE_NAME}/build/libs/*.jar app.jar

# Set ownership
RUN chown appuser:appgroup app.jar

USER appuser

# JVM tuning for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
