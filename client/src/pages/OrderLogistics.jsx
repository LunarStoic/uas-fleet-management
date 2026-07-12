// =============================================================================
// OrderLogistics — Order Management Page
// =============================================================================
// Full CRUD interface for logistics orders. Features:
//   - Create order form (origin/destination, payload, priority)
//   - Order list with status filter tabs
//   - Status lifecycle badges
//
// DATA: Managed via useOrderStore (Zustand)
// =============================================================================

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  MapPin,
  Weight,
  X,
  Send,
  Filter,
  Loader2,
  PackageOpen,
} from 'lucide-react';
import useOrderStore from '../store/useOrderStore';

/** Status filter tabs */
const STATUS_TABS = ['ALL', 'PENDING', 'ROUTED', 'IN_TRANSIT', 'DELIVERED'];

/** Badge class mapping */
const BADGE_CLASS = {
  PENDING: 'badge-pending',
  ROUTED: 'badge-routed',
  IN_TRANSIT: 'badge-in-transit',
  DELIVERED: 'badge-delivered',
  CANCELLED: 'badge-cancelled',
  FAILED: 'badge-failed',
};

function CreateOrderModal({ isOpen, onClose }) {
  const createOrder = useOrderStore((s) => s.createOrder);
  const loading = useOrderStore((s) => s.loading);

  const [form, setForm] = useState({
    originLatitude: '',
    originLongitude: '',
    originAddress: '',
    destLatitude: '',
    destLongitude: '',
    destAddress: '',
    payloadWeightKg: '',
    payloadDescription: '',
    priority: 'NORMAL',
  });

  if (!isOpen) return null;

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
      setForm({
        originLatitude: '', originLongitude: '', originAddress: '',
        destLatitude: '', destLongitude: '', destAddress: '',
        payloadWeightKg: '', payloadDescription: '', priority: 'NORMAL',
      });
    } catch {
      // Error handled by store
    }
  };

  const inputClass = 'bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 w-full transition-colors';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg mx-4 p-6 border-cyan-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">New Delivery Order</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origin */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              <MapPin className="w-3 h-3 text-emerald-400" /> Origin
            </label>
            <input type="text" placeholder="Address (optional)" value={form.originAddress}
              onChange={(e) => setForm({ ...form, originAddress: e.target.value })} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input type="number" step="any" placeholder="Latitude" required value={form.originLatitude}
                onChange={(e) => setForm({ ...form, originLatitude: e.target.value })} className={inputClass} />
              <input type="number" step="any" placeholder="Longitude" required value={form.originLongitude}
                onChange={(e) => setForm({ ...form, originLongitude: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              <MapPin className="w-3 h-3 text-red-400" /> Destination
            </label>
            <input type="text" placeholder="Address (optional)" value={form.destAddress}
              onChange={(e) => setForm({ ...form, destAddress: e.target.value })} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input type="number" step="any" placeholder="Latitude" required value={form.destLatitude}
                onChange={(e) => setForm({ ...form, destLatitude: e.target.value })} className={inputClass} />
              <input type="number" step="any" placeholder="Longitude" required value={form.destLongitude}
                onChange={(e) => setForm({ ...form, destLongitude: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Payload + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                <Weight className="w-3 h-3" /> Weight (kg)
              </label>
              <input type="number" step="0.01" min="0.1" placeholder="2.5" required value={form.payloadWeightKg}
                onChange={(e) => setForm({ ...form, payloadWeightKg: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider block">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className={inputClass}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider block">Description</label>
            <input type="text" placeholder="Payload description (optional)" value={form.payloadDescription}
              onChange={(e) => setForm({ ...form, payloadDescription: e.target.value })} className={inputClass} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OrderLogistics() {
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const fetchOrders = useOrderStore((s) => s.fetchOrders);

  const [activeTab, setActiveTab] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = activeTab === 'ALL'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Order Logistics</h1>
            <p className="text-xs text-slate-500">Create, track, and manage delivery orders</p>
          </div>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-900 font-semibold text-sm hover:bg-cyan-400 transition-colors">
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-4 shrink-0 bg-slate-800/50 rounded-lg p-1">
        {STATUS_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}>
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Order Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Route</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Weight</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {order.orderCode || `ORD-${order.id}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {order.originAddress || `${order.originLatitude?.toFixed(2)}, ${order.originLongitude?.toFixed(2)}`}
                      <span className="mx-1 text-slate-700">→</span>
                      {order.destAddress || `${order.destLatitude?.toFixed(2)}, ${order.destLongitude?.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {order.payloadWeightKg ?? '—'} kg
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${
                        order.priority === 'URGENT' ? 'text-red-400' :
                        order.priority === 'HIGH' ? 'text-amber-400' :
                        order.priority === 'LOW' ? 'text-slate-500' : 'text-slate-300'
                      }`}>
                        {order.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${BADGE_CLASS[order.status] || 'badge-pending'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <PackageOpen className="w-10 h-10 mb-3 text-slate-600" />
            <p className="text-sm font-medium">
              {activeTab === 'ALL' ? 'No orders yet' : `No ${activeTab.replace('_', ' ').toLowerCase()} orders`}
            </p>
            <p className="text-xs mt-1">Click &quot;New Order&quot; to create one</p>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
