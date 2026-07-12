// =============================================================================
// useDroneWebSocket — Real-Time Telemetry Hook (Auto-Reconnect)
// =============================================================================
// Custom React hook that manages the WebSocket connection to the Python
// telemetry-gateway service. Incoming telemetry data is parsed and written
// directly to useTelemetryStore.
//
// CONNECTION FLOW:
//   Connect → Parse JSON → Update store → (on close) → Wait → Reconnect
//
// AUTO-RECONNECT STRATEGY:
//   Uses exponential backoff with jitter:
//     Attempt 1: wait ~3s
//     Attempt 2: wait ~6s
//     Attempt 3: wait ~12s
//     ...up to max 10 retries, then give up.
//
// USAGE:
//   function DashboardLayout() {
//     useDroneWebSocket(); // Call once at the top-level layout
//     return <Outlet />;
//   }
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';
import useTelemetryStore from '../store/useTelemetryStore';

/** WebSocket URL from environment variables */
const WS_URL = `${import.meta.env.VITE_WS_TELEMETRY_URL}/ws/telemetry`;

/** Maximum number of reconnection attempts before giving up */
const MAX_RETRIES = 10;

/** Base delay in ms for reconnection (doubles each attempt) */
const BASE_DELAY = 3000;

export default function useDroneWebSocket() {
  const wsRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);

  // Get store actions (stable references — never cause re-renders)
  const updateDrone = useTelemetryStore((s) => s.updateDrone);
  const setConnectionStatus = useTelemetryStore((s) => s.setConnectionStatus);

  /**
   * Establishes a WebSocket connection and wires up event handlers.
   * Called on mount and on each reconnection attempt.
   */
  const connect = useCallback(() => {
    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log(`[WebSocket] Connecting to ${WS_URL}...`);
    setConnectionStatus('reconnecting');

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    // --- onopen: Connection established ---
    ws.onopen = () => {
      console.log('[WebSocket] Connected ✓');
      retryCountRef.current = 0; // Reset retry counter on success
      setConnectionStatus('connected');
    };

    // --- onmessage: Telemetry data received ---
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // The telemetry-gateway sends data in this shape:
        // { uavId, timestamp, position: {lat, lng, alt}, velocity, battery, ... }
        if (data.uavId) {
          updateDrone(data.uavId, data);
        }
      } catch (err) {
        console.warn('[WebSocket] Failed to parse message:', err);
      }
    };

    // --- onclose: Connection lost, attempt reconnection ---
    ws.onclose = (event) => {
      console.log(`[WebSocket] Closed (code: ${event.code})`);
      wsRef.current = null;

      // Don't reconnect if closed intentionally (code 1000 = normal closure)
      if (event.code === 1000) {
        setConnectionStatus('disconnected');
        return;
      }

      // Attempt reconnection with exponential backoff
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCountRef.current);
        // Add random jitter (±500ms) to prevent thundering herd
        const jitter = Math.random() * 1000 - 500;
        const totalDelay = Math.max(1000, delay + jitter);

        retryCountRef.current += 1;
        setConnectionStatus('reconnecting');
        console.log(
          `[WebSocket] Reconnecting in ${Math.round(totalDelay / 1000)}s ` +
          `(attempt ${retryCountRef.current}/${MAX_RETRIES})...`
        );

        retryTimeoutRef.current = setTimeout(connect, totalDelay);
      } else {
        console.error('[WebSocket] Max retries reached. Giving up.');
        setConnectionStatus('disconnected');
      }
    };

    // --- onerror: Log and let onclose handle reconnection ---
    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      // Don't handle here — `onclose` fires after `onerror` and handles retry
    };
  }, [updateDrone, setConnectionStatus]);

  // ---------------------------------------------------------------------------
  // Effect: Connect on mount, disconnect on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    connect();

    // Cleanup: close connection and cancel pending retry
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
      setConnectionStatus('disconnected');
    };
  }, [connect, setConnectionStatus]);
}
