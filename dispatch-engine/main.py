# =============================================================================
# Dispatch Engine — Route Optimization Service (FastAPI + RabbitMQ Consumer)
# =============================================================================
# This service is the AI brain for logistics route optimization. It:
#   1. Listens to 'route_optimization_queue' on RabbitMQ for new orders
#   2. Solves the Vehicle Routing Problem (VRP) using Google OR-Tools
#   3. Returns optimized delivery routes back to the system
#
# ARCHITECTURE ROLE:
#   [order-service (Java)] --publish--> [RabbitMQ] --consume--> [dispatch-engine (Python)]
#
# WHY PYTHON FOR VRP?
#   Google OR-Tools has the most mature Python bindings for operations research.
#   Python's scientific ecosystem (numpy, scipy) also provides excellent
#   support for geospatial computation and algorithm prototyping.
#
# STARTUP:
#   uvicorn main:app --host 0.0.0.0 --port 8090 --reload
# =============================================================================

import json
import logging
import os
import threading
from contextlib import asynccontextmanager

import pika
from dotenv import load_dotenv
from fastapi import FastAPI

# ---------------------------------------------------------------------------
# Environment Configuration
# ---------------------------------------------------------------------------
# Load variables from the root .env file. This ensures Python services use
# the same credentials as Java services and Docker Compose.
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', '5672'))
RABBITMQ_USER = os.getenv('RABBITMQ_DEFAULT_USER', 'uasfleet_mq')
RABBITMQ_PASS = os.getenv('RABBITMQ_DEFAULT_PASS', '')

# Queue name — MUST match the queue declared in Java's RabbitMQConfig.java
ROUTE_OPTIMIZATION_QUEUE = 'route_optimization_queue'

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('dispatch-engine')


# =============================================================================
# RabbitMQ Consumer Logic
# =============================================================================
def on_message_received(channel, method, properties, body):
    """
    Callback function invoked when a message arrives on the queue.

    MESSAGE FORMAT (from Java order-service):
        {
            "orderId": 123,
            "origin": {"lat": -6.200, "lng": 106.816},
            "destination": {"lat": -6.175, "lng": 106.827},
            "payloadWeight": 2.5
        }

    PROCESSING STEPS:
        1. Parse the JSON message
        2. Extract origin/destination coordinates
        3. Run VRP optimization (placeholder — will use OR-Tools in future)
        4. Log the optimized route result
        5. Acknowledge the message (tell RabbitMQ it was processed)

    Args:
        channel: The RabbitMQ channel for this consumer
        method: Delivery metadata (delivery tag, exchange, routing key)
        properties: Message properties (content type, headers, etc.)
        body: Raw message bytes (JSON-encoded)
    """
    try:
        # Step 1: Decode the JSON message from bytes
        message = json.loads(body.decode('utf-8'))
        order_id = message.get('orderId', 'UNKNOWN')
        logger.info(f'Received route optimization request for Order #{order_id}')

        # Step 2: Extract coordinates
        origin = message.get('origin', {})
        destination = message.get('destination', {})
        payload_weight = message.get('payloadWeight', 0)

        logger.info(
            f'  Origin: ({origin.get("lat")}, {origin.get("lng")}) | '
            f'Destination: ({destination.get("lat")}, {destination.get("lng")}) | '
            f'Payload: {payload_weight} kg'
        )

        # Step 3: VRP Optimization Placeholder
        # -----------------------------------------------------------------
        # In the next phase, this will use Google OR-Tools to solve the
        # Vehicle Routing Problem. For now, we log a placeholder result.
        #
        # FUTURE IMPLEMENTATION:
        #   from ortools.constraint_solver import routing_enums_pb2, pywrapcp
        #   manager = pywrapcp.RoutingIndexManager(...)
        #   routing = pywrapcp.RoutingModel(manager)
        #   solution = routing.SolveWithParameters(search_parameters)
        # -----------------------------------------------------------------
        optimized_route = {
            'orderId': order_id,
            'status': 'OPTIMIZED',
            'estimatedDistance_km': 5.2,
            'estimatedDuration_min': 12,
            'waypoints': [
                origin,
                {'lat': (origin.get('lat', 0) + destination.get('lat', 0)) / 2,
                 'lng': (origin.get('lng', 0) + destination.get('lng', 0)) / 2},
                destination
            ]
        }

        logger.info(f'  Route optimized: {json.dumps(optimized_route)}')

        # Step 4: Acknowledge the message
        # basic_ack tells RabbitMQ that the message has been successfully
        # processed and can be removed from the queue.
        channel.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(f'  Order #{order_id} acknowledged and removed from queue.')

    except json.JSONDecodeError as e:
        logger.error(f'Failed to parse message: {e}')
        # Reject and don't requeue malformed messages
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error(f'Error processing message: {e}', exc_info=True)
        # Reject but requeue for retry on unexpected errors
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def start_rabbitmq_consumer():
    """
    Starts the RabbitMQ consumer in a blocking loop.

    This function:
        1. Opens a connection to RabbitMQ using credentials from .env
        2. Declares the queue (idempotent — safe to call if queue exists)
        3. Sets prefetch_count=1 (process one message at a time)
        4. Begins consuming messages with the on_message_received callback
        5. Blocks the thread (runs forever until interrupted)

    IMPORTANT: This function blocks, so it must run in a separate thread
    to avoid blocking FastAPI's event loop.
    """
    try:
        # Build connection credentials from environment variables
        credentials = pika.PlainCredentials(
            username=RABBITMQ_USER,
            password=RABBITMQ_PASS
        )
        connection_params = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            # Heartbeat keeps the connection alive during idle periods
            heartbeat=600,
            # Timeout for blocking operations (e.g., waiting for connection)
            blocked_connection_timeout=300
        )

        logger.info(f'Connecting to RabbitMQ at {RABBITMQ_HOST}:{RABBITMQ_PORT}...')
        connection = pika.BlockingConnection(connection_params)
        channel = connection.channel()

        # Declare the queue (idempotent — no error if it already exists)
        # durable=True: queue survives RabbitMQ broker restart
        channel.queue_declare(queue=ROUTE_OPTIMIZATION_QUEUE, durable=True)

        # prefetch_count=1: Only deliver one message at a time to this consumer.
        # This prevents a single consumer from being overwhelmed and enables
        # fair distribution when multiple consumers are running.
        channel.basic_qos(prefetch_count=1)

        # Register the callback function for incoming messages
        # auto_ack=False: We manually acknowledge messages after processing
        # (ensures no message is lost if the consumer crashes mid-processing)
        channel.basic_consume(
            queue=ROUTE_OPTIMIZATION_QUEUE,
            on_message_callback=on_message_received,
            auto_ack=False
        )

        logger.info(f'Waiting for messages on queue: {ROUTE_OPTIMIZATION_QUEUE}')
        channel.start_consuming()

    except pika.exceptions.AMQPConnectionError as e:
        logger.warning(
            f'Could not connect to RabbitMQ: {e}. '
            f'The consumer will not be active. Start RabbitMQ and restart this service.'
        )
    except Exception as e:
        logger.error(f'RabbitMQ consumer error: {e}', exc_info=True)


# =============================================================================
# FastAPI Application Lifecycle
# =============================================================================
# The lifespan context manager handles startup and shutdown events.
# On startup, it launches the RabbitMQ consumer in a background thread
# so it doesn't block FastAPI's async event loop.
# =============================================================================
@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Application lifespan manager — runs code on startup and shutdown.

    STARTUP: Launches the RabbitMQ consumer in a daemon thread.
        - daemon=True: Thread dies when the main process exits
        - This prevents the consumer from keeping the app alive after shutdown

    SHUTDOWN: Logs a graceful shutdown message.
    """
    # --- STARTUP ---
    logger.info('Dispatch Engine starting up...')
    consumer_thread = threading.Thread(
        target=start_rabbitmq_consumer,
        name='rabbitmq-consumer',
        daemon=True  # Thread will be killed when main process exits
    )
    consumer_thread.start()
    logger.info('RabbitMQ consumer thread started.')

    yield  # Application is running here

    # --- SHUTDOWN ---
    logger.info('Dispatch Engine shutting down...')


# =============================================================================
# FastAPI Application Instance
# =============================================================================
app = FastAPI(
    title='UAS Fleet — Dispatch Engine',
    description=(
        'AI-powered route optimization service for UAS logistics. '
        'Consumes order messages from RabbitMQ and solves the Vehicle '
        'Routing Problem (VRP) using Google OR-Tools.'
    ),
    version='0.1.0',
    lifespan=lifespan
)


# =============================================================================
# REST Endpoints
# =============================================================================
@app.get('/health', tags=['System'])
async def health_check():
    """
    Health check endpoint for Docker healthcheck and monitoring tools.

    Returns:
        JSON with service status and configuration info.
    """
    return {
        'service': 'dispatch-engine',
        'status': 'UP',
        'rabbitmq': {
            'host': RABBITMQ_HOST,
            'port': RABBITMQ_PORT,
            'queue': ROUTE_OPTIMIZATION_QUEUE
        }
    }


@app.get('/', tags=['System'])
async def root():
    """Root endpoint — provides basic service information."""
    return {
        'service': 'UAS Fleet — Dispatch Engine',
        'version': '0.1.0',
        'docs': '/docs'
    }
