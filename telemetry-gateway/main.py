# =============================================================================
# Telemetry Gateway — Mission-Aware WebSocket Bridge (FastAPI)
# =============================================================================
# This service acts as a bridge between the dispatch-engine and the
# web-based frontend dashboard (via WebSocket).
#
# ARCHITECTURE ROLE:
#   [dispatch-engine] --POST /missions/start--> [telemetry-gateway] --WebSocket--> [Frontend]
#
# DATA FLOW:
#   1. dispatch-engine calls POST /missions/start with { uavId, orderId, waypoints }
#   2. gateway starts a per-UAV broadcast loop that iterates through waypoints
#   3. Position updates are pushed to all connected WebSocket clients in real-time
#   4. When waypoints are exhausted, the mission ends automatically
#
# STARTUP:
#   uvicorn main:app --host 0.0.0.0 --port 8091 --reload
# =============================================================================

import asyncio
import json
import logging
import math
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Environment Configuration
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

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
# Pydantic Models — Request/Response Schemas
# =============================================================================
class Waypoint(BaseModel):
    lat: float
    lng: float


class StartMissionRequest(BaseModel):
    uavId: str
    orderId: int
    waypoints: List[Waypoint]


class StopMissionRequest(BaseModel):
    uavId: str


# =============================================================================
# WebSocket Connection Manager
# =============================================================================
class ConnectionManager:
    """
    Manages active WebSocket connections for broadcasting telemetry data.

    DESIGN PATTERN: Observer Pattern
        - Clients connect via WebSocket and are added to the active set
        - When telemetry arrives, it's broadcast to ALL connected clients
        - Disconnected clients are automatically removed from the set
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(
            f'WebSocket client connected. '
            f'Total active connections: {len(self.active_connections)}'
        )

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(
            f'WebSocket client disconnected. '
            f'Total active connections: {len(self.active_connections)}'
        )

    async def broadcast(self, data: dict):
        """Send data to ALL connected WebSocket clients."""
        disconnected = set()
        for connection in self.active_connections.copy():
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.add(connection)

        for conn in disconnected:
            self.active_connections.discard(conn)


# Singleton instance of the connection manager
manager = ConnectionManager()

# =============================================================================
# Mission Registry — In-memory store of active UAV missions
# =============================================================================
# Key: uavId (str), Value: asyncio.Task running the broadcast loop
active_missions: Dict[str, asyncio.Task] = {}


# =============================================================================
# Mission Broadcast Loop — Per-UAV Coroutine
# =============================================================================
async def run_mission_broadcast(uav_id: str, order_id: int, waypoints: List[Waypoint]):
    """
    Broadcasts telemetry for a single UAV along its assigned waypoints.

    For each waypoint pair (segment), the UAV's position is interpolated
    and broadcast every second until the segment is complete. Once all
    waypoints are traversed, the mission ends.

    Args:
        uav_id: The UAV identifier, e.g. "UAV-001"
        order_id: The logistics order ID this mission serves
        waypoints: List of lat/lng waypoints defining the flight path
    """
    logger.info(f'Mission started for UAV {uav_id} (Order #{order_id}), '
                f'{len(waypoints)} waypoints')

    try:
        for i in range(len(waypoints) - 1):
            origin = waypoints[i]
            dest = waypoints[i + 1]

            # Calculate segment distance (Haversine approximation in degrees)
            dist = math.sqrt((dest.lat - origin.lat) ** 2 + (dest.lng - origin.lng) ** 2)
            # Number of steps per segment — 1 step/sec, proportional to distance
            steps = max(5, int(dist / 0.001))

            for step in range(steps):
                t = step / steps
                current_lat = origin.lat + t * (dest.lat - origin.lat)
                current_lng = origin.lng + t * (dest.lng - origin.lng)

                # Heading from origin to destination (degrees)
                d_lat = dest.lat - origin.lat
                d_lng = dest.lng - origin.lng
                heading = (math.degrees(math.atan2(d_lng, d_lat)) + 360) % 360

                telemetry = {
                    'uavId': uav_id,
                    'orderId': order_id,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'position': {
                        'latitude': round(current_lat, 7),
                        'longitude': round(current_lng, 7),
                        'altitude': 100.0  # Fixed cruise altitude (meters)
                    },
                    'velocity': {
                        'groundSpeed': 12.5,
                        'heading': round(heading, 1)
                    },
                    'battery': {
                        'percentage': max(0, 100 - (step * 0.5)),
                        'voltage': 22.2
                    },
                    'flightMode': 'AUTO',
                    'armed': True,
                    'missionStatus': 'IN_PROGRESS'
                }

                if manager.active_connections:
                    await manager.broadcast(telemetry)

                await asyncio.sleep(1)

        # Mission complete — send final status
        final = waypoints[-1]
        completion_telemetry = {
            'uavId': uav_id,
            'orderId': order_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'position': {
                'latitude': final.lat,
                'longitude': final.lng,
                'altitude': 0.0
            },
            'velocity': {'groundSpeed': 0.0, 'heading': 0},
            'battery': {'percentage': 80.0, 'voltage': 22.0},
            'flightMode': 'LANDED',
            'armed': False,
            'missionStatus': 'COMPLETED'
        }
        if manager.active_connections:
            await manager.broadcast(completion_telemetry)

        logger.info(f'Mission completed for UAV {uav_id} (Order #{order_id})')

    except asyncio.CancelledError:
        logger.info(f'Mission cancelled for UAV {uav_id}')
    finally:
        # Remove from active registry when done
        active_missions.pop(uav_id, None)


# =============================================================================
# FastAPI Application Lifecycle
# =============================================================================
@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan — no auto-start of telemetry. Missions are started
    explicitly via POST /missions/start from the dispatch-engine."""
    logger.info('Telemetry Gateway starting up — waiting for mission commands.')
    yield
    # Cancel all running missions on shutdown
    logger.info('Telemetry Gateway shutting down...')
    for uav_id, task in list(active_missions.items()):
        task.cancel()
        logger.info(f'Cancelled mission for UAV {uav_id}')


# =============================================================================
# FastAPI Application Instance
# =============================================================================
app = FastAPI(
    title='UAS Fleet — Telemetry Gateway',
    description=(
        'Real-time UAV telemetry bridge. Receives mission commands from the '
        'dispatch-engine and broadcasts position updates to frontend clients '
        'via WebSocket. No telemetry is broadcast without a valid mission.'
    ),
    version='1.0.0',
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
        };
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f'Received from client: {data}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info('Client disconnected from telemetry stream.')


# =============================================================================
# Mission Control Endpoints
# =============================================================================
@app.post('/missions/start', tags=['Missions'])
async def start_mission(request: StartMissionRequest):
    """
    Start broadcasting telemetry for a UAV on an assigned mission.
    Called by the dispatch-engine after route optimization.

    - If a mission for the same UAV is already active, it will be cancelled
      and replaced by the new one.
    """
    uav_id = request.uavId

    # Cancel any existing mission for this UAV
    if uav_id in active_missions:
        active_missions[uav_id].cancel()
        logger.info(f'Replaced existing mission for UAV {uav_id}')

    # Start new mission broadcast task
    task = asyncio.create_task(
        run_mission_broadcast(uav_id, request.orderId, request.waypoints)
    )
    active_missions[uav_id] = task

    logger.info(
        f'Mission registered: UAV={uav_id}, Order={request.orderId}, '
        f'Waypoints={len(request.waypoints)}'
    )
    return {
        'message': f'Mission started for UAV {uav_id}',
        'uavId': uav_id,
        'orderId': request.orderId,
        'waypointCount': len(request.waypoints)
    }


@app.post('/missions/stop', tags=['Missions'])
async def stop_mission(request: StopMissionRequest):
    """
    Stop broadcasting telemetry for a specific UAV.
    Called when a mission is cancelled or aborted.
    """
    uav_id = request.uavId
    if uav_id in active_missions:
        active_missions[uav_id].cancel()
        active_missions.pop(uav_id, None)
        logger.info(f'Mission stopped for UAV {uav_id}')
        return {'message': f'Mission stopped for UAV {uav_id}', 'uavId': uav_id}
    return {'message': f'No active mission found for UAV {uav_id}', 'uavId': uav_id}


@app.get('/missions', tags=['Missions'])
async def list_missions():
    """List all currently active UAV missions."""
    return {
        'activeMissions': list(active_missions.keys()),
        'count': len(active_missions)
    }


# =============================================================================
# REST Endpoints
# =============================================================================
@app.get('/health', tags=['System'])
async def health_check():
    """Health check endpoint for Docker healthcheck and monitoring."""
    return {
        'service': 'telemetry-gateway',
        'status': 'UP',
        'activeConnections': len(manager.active_connections),
        'activeMissions': list(active_missions.keys())
    }


@app.get('/', tags=['System'])
async def root():
    """Root endpoint — provides basic service information."""
    return {
        'service': 'UAS Fleet — Telemetry Gateway',
        'version': '1.0.0',
        'websocket': '/ws/telemetry',
        'missions': '/missions',
        'docs': '/docs'
    }
