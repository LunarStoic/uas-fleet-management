// =============================================================================
// FleetConfig — Drone Fleet Configuration Page
// =============================================================================
// Displays fleet UAVs in a card grid with specs and status indicators.
// Inspired by UAVDesk's config comparison view.
//
// Features:
//   - Grid of UAV cards with model, serial, status, and key specs
//   - Status-based color coding
//   - Placeholder for config diff tool (future implementation)
//
// DATA: Fetched from fleet-service via API Gateway (GET /api/v1/uavs)
// =============================================================================

import { useState, useEffect } from 'react';
import {
  Plane,
  Battery,
  Gauge,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
  Search,
  GitCompareArrows,
  Wrench,
} from 'lucide-react';
import api from '../config/api';

/** Status color mapping */
const STATUS_STYLES = {
  IDLE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Idle' },
  IN_MISSION: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'In Mission' },
  MAINTENANCE: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Maintenance' },
  RETIRED: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Retired' },
};

function UAVCard({ uav }) {
  const status = STATUS_STYLES[uav.status] || STATUS_STYLES.IDLE;

  return (
    <div className="glass-panel p-4 hover:border-cyan-500/30 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
            {uav.registrationCode || `UAV-${uav.id}`}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{uav.model || 'Unknown Model'}</p>
        </div>
        <span className={`badge ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Gauge className="w-3.5 h-3.5" />
          <span>{uav.maxSpeedMs ?? '—'} m/s</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>{uav.maxRangeKm ?? '—'} km</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Battery className="w-3.5 h-3.5" />
          <span>{uav.batteryCapacityWh ?? '—'} Wh</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{uav.totalFlightHours?.toFixed(1) ?? '0.0'} hrs</span>
        </div>
      </div>

      {/* Manufacturer + Serial */}
      <div className="pt-2 border-t border-slate-700/40 text-xs text-slate-500">
        <span>{uav.manufacturer || 'Unknown'}</span>
        <span className="mx-1.5 text-slate-700">·</span>
        <span className="font-mono">{uav.serialNumber || 'N/A'}</span>
      </div>
    </div>
  );
}

export default function FleetConfig() {
  const [uavs, setUavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchFleet() {
      try {
        const response = await api.get('/uavs');
        setUavs(response.data);
      } catch (err) {
        console.error('Failed to fetch fleet:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFleet();
  }, []);

  const filtered = uavs.filter((uav) =>
    (uav.registrationCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (uav.model || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Plane className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Fleet Configuration</h1>
            <p className="text-xs text-slate-500">Manage and compare drone configurations</p>
          </div>
        </div>

        {/* Search + Diff button */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search fleet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 w-64 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors">
            <GitCompareArrows className="w-4 h-4" />
            Compare
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((uav) => (
              <UAVCard key={uav.id} uav={uav} />
            ))}
          </div>
        ) : uavs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Wrench className="w-10 h-10 mb-3 text-slate-600" />
            <p className="text-sm font-medium">No UAVs registered</p>
            <p className="text-xs mt-1">Add drones via the fleet-service API</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <AlertTriangle className="w-10 h-10 mb-3 text-slate-600" />
            <p className="text-sm font-medium">No results for &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
