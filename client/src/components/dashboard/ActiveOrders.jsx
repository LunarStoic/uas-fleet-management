// =============================================================================
// ActiveOrders — Live Order List Panel
// =============================================================================
// Displays the list of logistics orders fetched from the REST API.
// Each order shows its code, origin→destination, status badge, and weight.
//
// SUBSCRIBES TO: useOrderStore (orders, loading)
// DOES NOT SUBSCRIBE TO: useTelemetryStore (prevents cross-render leaks)
//
// STATE ISOLATION: This component ONLY reads from the order store.
// Telemetry updates at 1Hz will NOT cause this list to re-render.
// =============================================================================

import { memo, useEffect } from 'react';
import {
  Package,
  MapPin,
  ArrowRight,
  Weight,
  Loader2,
  PackageOpen,
} from 'lucide-react';
import useOrderStore from '../../store/useOrderStore';

/** Map order status to badge CSS class */
const STATUS_BADGE = {
  PENDING: 'badge-pending',
  ROUTED: 'badge-routed',
  IN_TRANSIT: 'badge-in-transit',
  DELIVERED: 'badge-delivered',
  CANCELLED: 'badge-cancelled',
  FAILED: 'badge-failed',
};

/**
 * Single order card in the list.
 */
function OrderCard({ order }) {
  return (
    <div className="glass-panel p-3 hover:border-slate-600/70 transition-colors duration-200">
      {/* Top row: Order code + Status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-slate-300 font-semibold">
          {order.orderCode || `ORD-${order.id}`}
        </span>
        <span className={`badge ${STATUS_BADGE[order.status] || 'badge-pending'}`}>
          {order.status}
        </span>
      </div>

      {/* Route: Origin → Destination */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className="truncate">
          {order.originAddress || `${order.originLatitude?.toFixed(3)}, ${order.originLongitude?.toFixed(3)}`}
        </span>
        <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
        <MapPin className="w-3 h-3 text-red-400 shrink-0" />
        <span className="truncate">
          {order.destAddress || `${order.destLatitude?.toFixed(3)}, ${order.destLongitude?.toFixed(3)}`}
        </span>
      </div>

      {/* Bottom row: Weight + Priority */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Weight className="w-3 h-3" />
          <span>{order.payloadWeightKg ?? '—'} kg</span>
        </div>
        {order.priority && order.priority !== 'NORMAL' && (
          <span className={`text-xs font-semibold ${
            order.priority === 'URGENT' ? 'text-red-400' :
            order.priority === 'HIGH' ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {order.priority}
          </span>
        )}
      </div>
    </div>
  );
}

function ActiveOrders() {
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="glass-panel p-4 flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Active Orders</h3>
        </div>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <PackageOpen className="w-8 h-8 mb-2 text-slate-600" />
            <p className="text-sm font-medium">No active orders</p>
            <p className="text-xs mt-1">Orders will appear here when created</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ActiveOrders);
