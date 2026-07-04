package com.uasfleet.order.infrastructure.messaging;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * =============================================================================
 * RabbitMQ Configuration — Message Queue Setup
 * =============================================================================
 * Configures the RabbitMQ components used by order-service to communicate
 * asynchronously with the Python dispatch-engine.
 *
 * MESSAGE FLOW:
 *   1. A new order is created in order-service
 *   2. Order-service publishes a message to 'route_optimization_queue'
 *   3. dispatch-engine (Python) consumes the message
 *   4. dispatch-engine runs VRP algorithm to optimize the delivery route
 *   5. Results are published back (future implementation)
 *
 * WHY ASYNCHRONOUS MESSAGING?
 *   Route optimization is a CPU-intensive task (solving VRP is NP-hard).
 *   Using synchronous HTTP would block the order-service thread pool.
 *   RabbitMQ enables:
 *     - Non-blocking: order-service returns immediately after publishing
 *     - Resilient: messages are persisted in the queue if consumer is down
 *     - Scalable: multiple dispatch-engine instances can consume in parallel
 *     - Cross-language: Java publishes, Python consumes (language-agnostic)
 *
 * QUEUE CONFIGURATION:
 *   - durable: true → queue survives broker restart
 *   - Messages are serialized as JSON for cross-language compatibility
 * =============================================================================
 */
@Configuration
public class RabbitMQConfig {

    /**
     * Queue name constant — shared between producer (Java) and consumer (Python).
     * Both sides must use the exact same queue name.
     */
    public static final String ROUTE_OPTIMIZATION_QUEUE = "route_optimization_queue";

    /**
     * Declares the route optimization queue in RabbitMQ.
     * If the queue doesn't exist, Spring AMQP will create it on startup.
     *
     * @return a durable queue (survives broker restart)
     */
    @Bean
    public Queue routeOptimizationQueue() {
        // durable = true: queue and its messages persist across RabbitMQ restarts
        return new Queue(ROUTE_OPTIMIZATION_QUEUE, true);
    }

    /**
     * Configures JSON message serialization for RabbitMQ.
     * This ensures messages are sent as JSON (not Java-serialized bytes),
     * which is critical for cross-language compatibility with Python.
     *
     * Without this converter, Spring AMQP defaults to Java serialization,
     * which Python cannot deserialize.
     *
     * @return Jackson-based JSON message converter
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
