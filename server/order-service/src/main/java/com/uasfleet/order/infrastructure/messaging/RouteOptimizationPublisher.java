package com.uasfleet.order.infrastructure.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * =============================================================================
 * Route Optimization Publisher — Sends Messages to RabbitMQ
 * =============================================================================
 * This component encapsulates the logic for publishing route optimization
 * requests to the RabbitMQ queue consumed by the Python dispatch-engine.
 *
 * USAGE:
 *   @Autowired
 *   private RouteOptimizationPublisher publisher;
 *
 *   // In OrderService:
 *   publisher.publishOptimizationRequest(orderId, origin, destination, payload);
 *
 * MESSAGE FORMAT (JSON):
 *   {
 *     "orderId": 123,
 *     "origin": {"lat": -6.200, "lng": 106.816},
 *     "destination": {"lat": -6.175, "lng": 106.827},
 *     "payloadWeight": 2.5
 *   }
 * =============================================================================
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RouteOptimizationPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publishes a route optimization request to the dispatch-engine.
     *
     * @param message the optimization request payload (will be serialized to JSON)
     */
    public void publishOptimizationRequest(Map<String, Object> message) {
        log.info("Publishing route optimization request for order: {}", message.get("orderId"));
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.ROUTE_OPTIMIZATION_QUEUE,
            message
        );
        log.debug("Message published successfully to queue: {}", RabbitMQConfig.ROUTE_OPTIMIZATION_QUEUE);
    }
}
