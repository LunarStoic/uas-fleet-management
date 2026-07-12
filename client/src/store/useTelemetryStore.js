// =============================================================================
// Telemetry Store — Real-Time Drone State (Zustand)
// =============================================================================
// This store holds ONLY real-time telemetry data coming from the WebSocket
// connection to the telemetry-gateway Python service.
//
// STATE ISOLATION PRINCIPLE:
//   This store is deliberately separated from useOrderStore to prevent
//   telemetry updates (~1Hz) from triggering re-renders in unrelated
//   components like order forms or fleet config pages.
//
//   WRONG: One big store → LiveMap re-renders when you type in a form
//   RIGHT: Isolated stores → LiveMap only re-renders on telemetry updates
//
// PERFORMANCE TIP:
//   Always use selector functions when subscribing to this store:
//     ✅ const drones = useTelemetryStore(state => state.drones);
//     ❌ const store = useTelemetryStore();  // subscribes to EVERYTHING
// =============================================================================

import { create } from 'zustand';

const useTelemetryStore = create((set) => ({
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /**
   * Map of active drone telemetry, keyed by UAV ID.
   * Shape: { [uavId]: { position, velocity, battery, flightMode, armed, timestamp } }
   */
  drones: {},

  /**
   * WebSocket connection status.
   * Used by UI to show connection indicator (green/yellow/red dot).
   */
  connectionStatus: 'disconnected', // 'connected' | 'disconnected' | 'reconnecting'

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Update or insert telemetry data for a specific drone.
   * Called by the useDroneWebSocket hook on each incoming message.
   *
   * Uses a function updater to merge new data with existing drone state,
   * preventing data loss if only partial updates are received.
   */
  updateDrone: (uavId, data) =>
    set((state) => ({
      drones: {
        ...state.drones,
        [uavId]: {
          ...state.drones[uavId],
          ...data,
          lastUpdate: Date.now(),
        },
      },
    })),

  /**
   * Update WebSocket connection status.
   */
  setConnectionStatus: (status) =>
    set({ connectionStatus: status }),

  /**
   * Clear all drone data (e.g., on disconnect or reset).
   */
  clearAll: () =>
    set({ drones: {}, connectionStatus: 'disconnected' }),
}));

export default useTelemetryStore;
