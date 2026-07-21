// =============================================================================
// OrderLogistics — Premium Order Management Page
// =============================================================================

import { useState, useEffect } from 'react';
import {
  Package, Plus, MapPin, Weight, X, Send,
  Loader2, PackageOpen, Route, ChevronDown,
  ArrowRight, Clock, AlertCircle,
} from 'lucide-react';
import useOrderStore from '../store/useOrderStore';

const STATUS_TABS = ['ALL', 'PENDING', 'DISPATCHING', 'ROUTED', 'IN_TRANSIT', 'DELIVERED'];

const STATUS_META = {
  PENDING:     { badge: 'badge-pending',    dot: 'bg-amber-400',   label: 'Pending' },
  DISPATCHING: { badge: 'badge-dispatching',dot: 'bg-blue-400 animate-pulse', label: 'Dispatching' },
  ROUTED:      { badge: 'badge-routed',     dot: 'bg-cyan-400',    label: 'Routed' },
  IN_TRANSIT:  { badge: 'badge-in-transit', dot: 'bg-violet-400',  label: 'In Transit' },
  DELIVERED:   { badge: 'badge-delivered',  dot: 'bg-emerald-400', label: 'Delivered' },
  CANCELLED:   { badge: 'badge-cancelled',  dot: 'bg-slate-500',   label: 'Cancelled' },
  FAILED:      { badge: 'badge-failed',     dot: 'bg-red-400',     label: 'Failed' },
};

const PRIORITY_CFG = {
  URGENT: { label: 'URGENT', cls: 'text-red-400 bg-red-500/10 ring-1 ring-red-500/25' },
  HIGH:   { label: 'HIGH',   cls: 'text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/25' },
  NORMAL: { label: 'NORMAL', cls: 'text-slate-400 bg-slate-500/10 ring-1 ring-slate-500/25' },
  LOW:    { label: 'LOW',    cls: 'text-slate-500 bg-slate-700/20 ring-1 ring-slate-700/30' },
};

// ---------------------------------------------------------------------------
// Create Order Modal
// ---------------------------------------------------------------------------
function CreateOrderModal({ isOpen, onClose }) {
  const createOrder = useOrderStore((s) => s.createOrder);
  const loading = useOrderStore((s) => s.loading);
  const [form, setForm] = useState({
    originLatitude: '', originLongitude: '', originAddress: '',
    destLatitude: '', destLongitude: '', destAddress: '',
    payloadWeightKg: '', payloadDescription: '', priority: 'NORMAL',
  });

  if (!isOpen) return null;

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrder({
        ...form,
        originLatitude: parseFloat(form.originLatitude),
        originLongitude: parseFloat(form.originLongitude),
        destLatitude: parseFloat(form.destLatitude),
        destLongitude: parseFloat(form.destLongitude),
        payloadWeightKg: parseFloat(form.payloadWeightKg),
      });
      onClose();
      setForm({ originLatitude: '', originLongitude: '', originAddress: '', destLatitude: '', destLongitude: '', destAddress: '', payloadWeightKg: '', payloadDescription: '', priority: 'NORMAL' });
    } catch { /* handled by store */ }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel-glow w-full max-w-lg mx-4 p-6 overflow-y-auto max-h-[90vh] animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Send className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">New Delivery Order</h2>
              <p className="text-xs text-slate-500">Enter route and payload details</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Origin */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />Origin
            </label>
            <input type="text" placeholder="Address label (optional)" value={form.originAddress} onChange={f('originAddress')} className="field-input" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="any" placeholder="Latitude" required value={form.originLatitude} onChange={f('originLatitude')} className="field-input" />
              <input type="number" step="any" placeholder="Longitude" required value={form.originLongitude} onChange={f('originLongitude')} className="field-input" />
            </div>
          </div>

          {/* Arrow separator */}
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-slate-800" />
            <ArrowRight className="w-4 h-4 text-slate-600" />
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <div className="w-2 h-2 rounded-full bg-red-400" />Destination
            </label>
            <input type="text" placeholder="Address label (optional)" value={form.destAddress} onChange={f('destAddress')} className="field-input" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="any" placeholder="Latitude" required value={form.destLatitude} onChange={f('destLatitude')} className="field-input" />
              <input type="number" step="any" placeholder="Longitude" required value={form.destLongitude} onChange={f('destLongitude')} className="field-input" />
            </div>
          </div>

          {/* Payload */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Weight className="w-3 h-3" />Weight (kg)
              </label>
              <input type="number" step="0.01" min="0.1" placeholder="2.5" required value={form.payloadWeightKg} onChange={f('payloadWeightKg')} className="field-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Priority</label>
              <div className="relative">
                <select value={form.priority} onChange={f('priority')} className="field-input appearance-none pr-8">
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Description</label>
            <input type="text" placeholder="Payload description (optional)" value={form.payloadDescription} onChange={f('payloadDescription')} className="field-input" />
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Creating order...' : 'Create Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function OrderLogistics() {
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);
  const generateRoute = useOrderStore((s) => s.generateRoute);
  const error = useOrderStore((s) => s.error);

  const [activeTab, setActiveTab] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(null);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = activeTab === 'ALL' ? orders : orders.filter((o) => o.status === activeTab);

  const handleGenerateRoute = async (orderId) => {
    setRouteLoading(orderId);
    try { await generateRoute(orderId); } catch { /* noop */ } finally { setRouteLoading(null); }
  };

  // Summary counts
  const counts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'ALL' ? orders.length : orders.filter((o) => o.status === tab).length;
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#060d1a' }}>
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(167,139,250,0.12)' }}>
            <Package className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">Order Logistics</h1>
            <p className="text-xs text-slate-500">{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-6 mt-3 p-3 rounded-xl bg-red-500/8 border border-red-500/20 flex items-center gap-2 text-sm text-red-400 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Status tabs ── */}
      <div className="px-6 pt-4 pb-0 shrink-0">
        <div className="flex items-center gap-1 bg-slate-900/60 rounded-xl p-1 w-fit border border-slate-800/70">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = counts[tab];
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-700/80 text-slate-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}>
                {tab.replace('_', ' ')}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-slate-600 text-slate-300' : 'bg-slate-800 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Order Table ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 w-full skeleton rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="glass-panel overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Order</th><th>Route</th><th>Weight</th><th>Priority</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const sm = STATUS_META[order.status] || STATUS_META.PENDING;
                  const pr = PRIORITY_CFG[order.priority] || PRIORITY_CFG.NORMAL;
                  return (
                    <tr key={order.id}>
                      <td>
                        <div>
                          <p className="text-xs font-mono font-semibold text-slate-200">{order.orderCode || `ORD-${order.id}`}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                          </p>
                        </div>
                      </td>
                      <td className="max-w-[200px]">
                        <div className="flex items-start gap-1.5 text-xs text-slate-400">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="truncate text-emerald-400/80 text-[11px]">
                              {order.originAddress || `${order.originLatitude?.toFixed(3)}, ${order.originLongitude?.toFixed(3)}`}
                            </span>
                            <div className="w-px h-2 bg-slate-700 ml-1" />
                            <span className="truncate text-red-400/80 text-[11px]">
                              {order.destAddress || `${order.destLatitude?.toFixed(3)}, ${order.destLongitude?.toFixed(3)}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-300">{order.payloadWeightKg ?? '—'} kg</span>
                      </td>
                      <td>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${pr.cls}`}>{pr.label}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${sm.badge}`}>{order.status}</span>
                        </div>
                      </td>
                      <td>
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleGenerateRoute(order.id)}
                            disabled={routeLoading === order.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 transition-all duration-200 disabled:opacity-40"
                            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.18)' }}
                          >
                            {routeLoading === order.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Route className="w-3 h-3" />}
                            {routeLoading === order.id ? 'Sending…' : 'Generate Route'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 text-slate-600">
            <PackageOpen className="w-12 h-12 mb-3 text-slate-700" />
            <p className="text-sm font-medium text-slate-500">
              {activeTab === 'ALL' ? 'No orders yet' : `No ${activeTab.toLowerCase()} orders`}
            </p>
            <p className="text-xs mt-1">Create your first order using the button above</p>
          </div>
        )}
      </div>

      <CreateOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
