# =============================================================================
# Telemetry Gateway — MAVLink-to-WebSocket Bridge (FastAPI)
# =============================================================================
# This service acts as a bridge between the UAV flight controller (via MAVLink
# protocol) and the web-based frontend dashboard (via WebSocket).
#
# ARCHITECTURE ROLE:
#   [UAV / SITL Simulator] --MAVLink--> [telemetry-gateway] --WebSocket--> [Frontend]
#
# DATA FLOW:
#   1. The gateway connects to a MAVLink endpoint (SITL simulator or real UAV)
#   2. It receives telemetry data: GPS position, altitude, speed, battery, etc.
#   3. The data is reformatted as JSON and broadcast to all connected WebSocket
#      clients in real-time.
#
# WHAT IS MAVLink?
#   MAVLink (Micro Air Vehicle Link) is a lightweight messaging protocol for
#   communicating with drones and autopilots (ArduPilot, PX4). It defines
#   standard messages for GPS, attitude, battery, mission commands, etc.
#
# WHAT IS SITL?
#   Software In The Loop — a simulator that runs the actual autopilot firmware
#   on your computer without needing physical hardware. It generates realistic
#   telemetry data for development and testing.
#
# STARTUP:
#   uvicorn main:app --host 0.0.0.0 --port 8091 --reload
# =============================================================================

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Set

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

# ---------------------------------------------------------------------------
# Environment Configuration
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# MAVLink connection string for SITL simulator
# Default: tcp:127.0.0.1:5760 (ArduPilot SITL default)
MAVLINK_CONNECTION = os.getenv('MAVLINK_CONNECTION', 'tcp:127.0.0.1:5760')

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('telemetry-gateway')


# =============================================================================
# WebSocket Connection Manager
# =============================================================================
class ConnectionManager:
    """
    Manages active WebSocket connections for broadcasting telemetry data.

    DESIGN PATTERN: Observer Pattern
        - Clients connect via WebSocket and are added to the active set
        - When new telemetry data arrives, it's broadcast to ALL connected clients
        - Disconnected clients are automatically removed from the set

    THREAD SAFETY:
        FastAPI handles WebSocket connections asynchronously (single event loop),
        so a simple set is sufficient — no locks needed.
    """

    def __init__(self):
        # Set of active WebSocket connections
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """
        Accept a new WebSocket connection and add it to the active set.

        Args:
            websocket: The incoming WebSocket connection to accept
        """
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(
            f'WebSocket client connected. '
            f'Total active connections: {len(self.active_connections)}'
        )

    def disconnect(self, websocket: WebSocket):
        """
        Remove a disconnected WebSocket from the active set.

        Args:
            websocket: The WebSocket that disconnected
        """
        self.active_connections.discard(websocket)
        logger.info(
            f'WebSocket client disconnected. '
            f'Total active connections: {len(self.active_connections)}'
        )

    async def broadcast(self, data: dict):
        """
        Send data to ALL connected WebSocket clients.

        If a client fails to receive the message (broken pipe, timeout),
        it is silently removed from the active set.

        Args:
            data: Dictionary to send as JSON to all clients
        """
        # Create a copy of the set to avoid modification during iteration
        disconnected = set()
        for connection in self.active_connections.copy():
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.add(connection)

        # Clean up failed connections
        for conn in disconnected:
            self.active_connections.discard(conn)


# Singleton instance of the connection manager
manager = ConnectionManager()


# =============================================================================
# Simulated Telemetry Data Generator
# =============================================================================
async def generate_simulated_telemetry():
    """
    Generates simulated UAV telemetry data and broadcasts via WebSocket.

    SIMULATION DATA INCLUDES:
        - GPS coordinates (latitude, longitude, altitude)
        - Speed and heading
        - Battery level
        - Flight mode and armed status

    NOTE: In production, this function would be replaced by a pymavlink
    connection to a real SITL simulator or physical UAV. The simulated data
    follows the same JSON schema that the real implementation would use.

    FUTURE IMPLEMENTATION (pymavlink):
        from pymavlink import mavutil
        master = mavutil.mavlink_connection(MAVLINK_CONNECTION)
        master.wait_heartbeat()
        while True:
            msg = master.recv_match(type='GLOBAL_POSITION_INT', blocking=True)
            telemetry = {
                'lat': msg.lat / 1e7,
                'lng': msg.lon / 1e7,
                'altitude': msg.relative_alt / 1000,
                ...
            }
    """
    # Starting position: Medan, North Sumatra, Indonesia
    base_lat = 3.5952
    base_lng = 98.6722
    altitude = 100.0  # meters
    tick = 0

    logger.info('Starting simulated telemetry broadcast...')

    while True:
        # Simulate a circular flight path
        import math
        tick += 1
        angle = math.radians(tick % 360)
        radius = 0.005  # ~500m radius in degree coordinates

        telemetry = {
            'uavId': 'UAV-SIM-001',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'position': {
                'latitude': base_lat + radius * math.sin(angle),
                'longitude': base_lng + radius * math.cos(angle),
                'altitude': altitude + 10 * math.sin(angle / 2)
            },
            'velocity': {
                'groundSpeed': 12.5 + 2 * math.sin(angle),
                'heading': (tick * 1) % 360
            },
            'battery': {
                'percentage': max(0, 100 - tick * 0.01),
                'voltage': 22.2 - tick * 0.001
            },
            'flightMode': 'AUTO',
            'armed': True
        }

        # Only broadcast if there are connected clients
        if manager.active_connections:
            await manager.broadcast(telemetry)

        # Send telemetry every 1 second (1 Hz update rate)
        await asyncio.sleep(1)


# =============================================================================
# FastAPI Application Lifecycle
# =============================================================================
@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Application lifespan — starts/stops the telemetry broadcast task.
    """
    # --- STARTUP ---
    logger.info('Telemetry Gateway starting up...')
    # Create an async task for the telemetry generator
    telemetry_task = asyncio.create_task(generate_simulated_telemetry())
    logger.info('Simulated telemetry broadcast task started.')

    yield  # Application is running

    # --- SHUTDOWN ---
    logger.info('Telemetry Gateway shutting down...')
    telemetry_task.cancel()
    try:
        await telemetry_task
    except asyncio.CancelledError:
        logger.info('Telemetry broadcast task cancelled.')


# =============================================================================
# FastAPI Application Instance
# =============================================================================
app = FastAPI(
    title='UAS Fleet — Telemetry Gateway',
    description=(
        'Real-time UAV telemetry bridge. Receives MAVLink telemetry from '
        'flight controllers (or SITL simulator) and broadcasts to frontend '
        'clients via WebSocket.'
    ),
    version='0.1.0',
    lifespan=lifespan
)


# =============================================================================
# WebSocket Endpoint — Real-time Telemetry Stream
# =============================================================================
@app.websocket('/ws/telemetry')
async def websocket_telemetry(websocket: WebSocket):
    """
    WebSocket endpoint for real-time UAV telemetry streaming.

    USAGE (JavaScript client):
        const ws = new WebSocket('ws://localhost:8091/ws/telemetry');
        ws.onmessage = (event) => {
            const telemetry = JSON.parse(event.data);
            updateMap(telemetry.position.latitude, telemetry.position.longitude);
            updateDashboard(telemetry);
        };

    PROTOCOL:
        - Client connects → server accepts and adds to broadcast list
        - Server pushes telemetry JSON every second (1 Hz)
        - Client can send ping/pong to keep connection alive
        - On disconnect, client is removed from broadcast list
    """
    await manager.connect(websocket)
    try:
        # Keep the connection alive — listen for client messages (ping/pong)
        while True:
            # Wait for any message from the client (keeps connection open)
            # In a production system, this could handle commands like
            # "subscribe to specific UAV" or "change update frequency"
            data = await websocket.receive_text()
            logger.debug(f'Received from client: {data}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info('Client disconnected from telemetry stream.')


# =============================================================================
# REST Endpoints
# =============================================================================
@app.get('/health', tags=['System'])
async def health_check():
    """
    Health check endpoint for Docker healthcheck and monitoring.

    Returns:
        Service status and number of active WebSocket connections.
    """
    return {
        'service': 'telemetry-gateway',
        'status': 'UP',
        'activeConnections': len(manager.active_connections),
        'mavlinkTarget': MAVLINK_CONNECTION
    }


@app.get('/', tags=['System'])
async def root():
    """Root endpoint — provides basic service information."""
    return {
        'service': 'UAS Fleet — Telemetry Gateway',
        'version': '0.1.0',
        'websocket': '/ws/telemetry',
        'docs': '/docs'
    }
