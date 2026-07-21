# =============================================================================
# Dispatch Engine — Route Optimization Service (FastAPI + RabbitMQ Consumer)
# =============================================================================
# This service is the logistics brain. It:
#   1. Listens to 'route_optimization_queue' on RabbitMQ for new orders
#   2. Fetches available UAVs from fleet-service REST API
#   3. Generates a simple waypoint route (origin → midpoint → destination)
#   4. Updates the order status in order-service to 'ROUTED'
#   5. Calls telemetry-gateway to begin broadcasting the UAV's position
#
# ARCHITECTURE ROLE:
#   [order-service] → RabbitMQ → [dispatch-engine] → telemetry-gateway
#                                                   → order-service (status update)
#                                                   → fleet-service (status update)
#
# STARTUP:
#   uvicorn main:app --host 0.0.0.0 --port 8090 --reload
# =============================================================================

import json
import logging
import os
import threading
from contextlib import asynccontextmanager

import httpx
import pika
from dotenv import load_dotenv
from fastapi import FastAPI

# ---------------------------------------------------------------------------
# Environment Configuration
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', '5672'))
RABBITMQ_USER = os.getenv('RABBITMQ_DEFAULT_USER', 'uasfleet_mq')
RABBITMQ_PASS = os.getenv('RABBITMQ_DEFAULT_PASS', '')

# Service URLs — used to call back into other microservices
# These default to internal Docker network hostnames
FLEET_SERVICE_URL = os.getenv('FLEET_SERVICE_URL', 'http://fleet-service:8081')
ORDER_SERVICE_URL = os.getenv('ORDER_SERVICE_URL', 'http://order-service:8082')
TELEMETRY_GATEWAY_URL = os.getenv('TELEMETRY_GATEWAY_URL', 'http://telemetry-gateway:8091')

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
# Route Optimization Logic
# =============================================================================
def compute_waypoints(origin: dict, destination: dict) -> list:
    """
    Builds a 3-point waypoint list: origin → midpoint → destination.

    This is a simple placeholder for a full VRP solver. In production,
    Google OR-Tools would be used to account for UAV range, obstacles,
    restricted airspace, and multi-stop routing.

    Args:
        origin: {'lat': float, 'lng': float}
        destination: {'lat': float, 'lng': float}

    Returns:
        List of waypoint dicts in the format expected by telemetry-gateway
    """
    mid_lat = (origin['lat'] + destination['lat']) / 2
    mid_lng = (origin['lng'] + destination['lng']) / 2

    return [
        {'lat': origin['lat'], 'lng': origin['lng']},
        {'lat': mid_lat, 'lng': mid_lng},
        {'lat': destination['lat'], 'lng': destination['lng']},
    ]


# =============================================================================
# RabbitMQ Consumer Logic
# =============================================================================
def on_message_received(channel, method, properties, body):
    """
    Callback invoked when a route optimization message arrives.

    MESSAGE FORMAT (from Java order-service):
        {
            "orderId": 123,
            "orderCode": "ORD-20260716-0001",
            "origin": {"lat": 3.5952, "lng": 98.6722},
            "destination": {"lat": 3.6200, "lng": 98.7000},
            "payloadWeight": 2.5,
            "priority": "NORMAL"
        }

    PROCESSING STEPS:
        1. Parse the JSON message
        2. Fetch available UAVs from fleet-service
        3. Select the first available UAV
        4. Compute waypoints
        5. Update order status to ROUTED in order-service
        6. Mark UAV as IN_MISSION in fleet-service
        7. Start telemetry broadcast in telemetry-gateway
        8. Acknowledge the message
    """
    try:
        # Step 1: Parse message
        message = json.loads(body.decode('utf-8'))
        order_id = message.get('orderId', 'UNKNOWN')
        order_code = message.get('orderCode', f'ORD-{order_id}')
        logger.info(f'Processing route optimization for Order #{order_id} ({order_code})')

        origin = message.get('origin', {})
        destination = message.get('destination', {})

        # Step 2: Fetch available UAVs
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f'{FLEET_SERVICE_URL}/uavs/available')
            resp.raise_for_status()
            available_uavs = resp.json()

        if not available_uavs:
            logger.warning(f'No available UAVs for Order #{order_id}. Requeuing...')
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            return

        # Step 3: Select first available UAV
        uav = available_uavs[0]
        uav_id = uav.get('id')
        uav_registration = uav.get('registrationCode', f'UAV-{uav_id}')
        logger.info(f'Assigned UAV {uav_registration} (id={uav_id}) to Order #{order_id}')

        # Step 4: Compute waypoints
        waypoints = compute_waypoints(origin, destination)
        logger.info(f'Computed {len(waypoints)} waypoints')

        with httpx.Client(timeout=10.0) as client:
            # Step 5: Update order status → ROUTED
            order_resp = client.patch(
                f'{ORDER_SERVICE_URL}/{order_id}/status',
                json={'status': 'ROUTED'}
            )
            if order_resp.is_success:
                logger.info(f'Order #{order_id} status updated to ROUTED')
            else:
                logger.warning(f'Failed to update order status: {order_resp.status_code}')

            # Step 6: Mark UAV as IN_MISSION
            fleet_resp = client.patch(
                f'{FLEET_SERVICE_URL}/uavs/{uav_id}/status',
                json={'status': 'IN_MISSION'}
            )
            if fleet_resp.is_success:
                logger.info(f'UAV {uav_registration} status updated to IN_MISSION')
            else:
                logger.warning(f'Failed to update UAV status: {fleet_resp.status_code}')

            # Step 7: Start telemetry broadcast
            telemetry_resp = client.post(
                f'{TELEMETRY_GATEWAY_URL}/missions/start',
                json={
                    'uavId': uav_registration,
                    'orderId': order_id,
                    'waypoints': waypoints
                }
            )
            if telemetry_resp.is_success:
                logger.info(
                    f'Telemetry broadcast started for UAV {uav_registration} '
                    f'(Order #{order_id})'
                )
            else:
                logger.warning(
                    f'Failed to start telemetry: {telemetry_resp.status_code}'
                )

        # Step 8: Acknowledge message — processed successfully
        channel.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(f'Order #{order_id} dispatch complete. UAV: {uav_registration}')

    except json.JSONDecodeError as e:
        logger.error(f'Failed to parse message: {e}')
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except httpx.RequestError as e:
        logger.error(f'HTTP error during dispatch for Order #{order_id}: {e}', exc_info=True)
        # Requeue — service might be temporarily unavailable
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
    except Exception as e:
        logger.error(f'Unexpected error processing Order #{order_id}: {e}', exc_info=True)
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def start_rabbitmq_consumer():
    """
    Starts the RabbitMQ consumer in a blocking loop.
    Runs in a daemon thread to avoid blocking FastAPI's event loop.
    """
    try:
        credentials = pika.PlainCredentials(
            username=RABBITMQ_USER,
            password=RABBITMQ_PASS
        )
        connection_params = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )

        logger.info(f'Connecting to RabbitMQ at {RABBITMQ_HOST}:{RABBITMQ_PORT}...')
        connection = pika.BlockingConnection(connection_params)
        channel = connection.channel()

        channel.queue_declare(queue=ROUTE_OPTIMIZATION_QUEUE, durable=True)
        channel.basic_qos(prefetch_count=1)
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
            f'Consumer will not be active. Start RabbitMQ and restart this service.'
        )
    except Exception as e:
        logger.error(f'RabbitMQ consumer error: {e}', exc_info=True)


# =============================================================================
# FastAPI Application Lifecycle
# =============================================================================
@asynccontextmanager
async def lifespan(application: FastAPI):
    """Starts the RabbitMQ consumer thread on startup."""
    logger.info('Dispatch Engine starting up...')
    logger.info(
        f'Service URLs: fleet={FLEET_SERVICE_URL}, '
        f'order={ORDER_SERVICE_URL}, '
        f'telemetry={TELEMETRY_GATEWAY_URL}'
    )
    consumer_thread = threading.Thread(
        target=start_rabbitmq_consumer,
        name='rabbitmq-consumer',
        daemon=True
    )
    consumer_thread.start()
    logger.info('RabbitMQ consumer thread started.')

    yield

    logger.info('Dispatch Engine shutting down...')


# =============================================================================
# FastAPI Application Instance
# =============================================================================
app = FastAPI(
    title='UAS Fleet — Dispatch Engine',
    description=(
        'Route optimization and mission dispatch service. '
        'Consumes order messages from RabbitMQ, assigns UAVs, '
        'and coordinates with telemetry-gateway to begin real mission broadcasts.'
    ),
    version='1.0.0',
    lifespan=lifespan
)


# =============================================================================
# REST Endpoints
# =============================================================================
@app.get('/health', tags=['System'])
async def health_check():
    """Health check endpoint."""
    return {
        'service': 'dispatch-engine',
        'status': 'UP',
        'rabbitmq': {
            'host': RABBITMQ_HOST,
            'port': RABBITMQ_PORT,
            'queue': ROUTE_OPTIMIZATION_QUEUE
        },
        'serviceUrls': {
            'fleetService': FLEET_SERVICE_URL,
            'orderService': ORDER_SERVICE_URL,
            'telemetryGateway': TELEMETRY_GATEWAY_URL
        }
    }


@app.get('/', tags=['System'])
async def root():
    """Root endpoint — provides basic service information."""
    return {
        'service': 'UAS Fleet — Dispatch Engine',
        'version': '1.0.0',
        'docs': '/docs'
    }
