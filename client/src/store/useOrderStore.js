// =============================================================================
// Order Store — Transactional Logistics State (Zustand)
// =============================================================================
// Manages logistics order data fetched from the REST API (order-service via
// API Gateway). This is standard CRUD state — NOT real-time.
//
// STATE ISOLATION:
//   Separated from useTelemetryStore so that order list updates (user actions,
//   form inputs) do NOT trigger re-renders in the LiveMap or telemetry widgets.
// =============================================================================

import { create } from "zustand";
import api from "../config/api";

const useOrderStore = create((set, get) => ({
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** Array of logistics order objects from the API */
  orders: [],

  /** Loading state for async operations */
  loading: false,

  /** Error message from the last failed operation */
  error: null,

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Fetch all orders from the order-service via API Gateway.
   * Route: GET /api/v1/orders
   */
  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/orders");
      set({ orders: response.data, loading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch orders",
        loading: false,
      });
    }
  },

  /**
   * Create a new logistics order.
   * Route: POST /api/v1/orders
   *
   * @param {Object} orderData - Order payload (origin, destination, weight, etc.)
   */
  createOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/orders", orderData);
      set((state) => ({
        orders: [response.data, ...state.orders],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to create order",
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Update the status of an existing order.
   * Route: PATCH /api/v1/orders/:id/status
   *
   * @param {number} orderId - The order ID to update
   * @param {string} newStatus - New status (PENDING, ROUTED, IN_TRANSIT, DELIVERED, etc.)
   */
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      }));
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update order status",
      });
    }
  },

  /**
   * Trigger the dispatch pipeline for a PENDING order.
   * Route: POST /api/v1/orders/:id/generate-route
   *
   * Calls order-service which validates UAV availability, publishes to
   * RabbitMQ, and returns the order with status DISPATCHING.
   *
   * @param {number} orderId - The PENDING order ID to dispatch
   */
  generateRoute: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/orders/${orderId}/generate-route`);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? response.data : order,
        ),
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to generate route. No UAVs available?",
        loading: false,
      });
      throw error;
    }
  },

  /** Clear any error message */
  clearError: () => set({ error: null }),
}));

export default useOrderStore;
