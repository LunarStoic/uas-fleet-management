// =============================================================================
// Logbook — Flight History / Reports Page
// =============================================================================
// Table-based view of flight history fetched from report-service.
// Features filtering by date range and UAV ID.
//
// DATA: GET /api/v1/reports/flights (via API Gateway)
// =============================================================================

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  Plane,
  MapPin,
  Loader2,
  FileText,
  Download,
  Search,
} from 'lucide-react';
import api from '../config/api';

export default function Logbook() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchFlights() {
      try {
        const response = await api.get('/reports/flights');
        setFlights(response.data);
      } catch (err) {
        console.error('Failed to fetch flights:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlights();
  }, []);

  const filtered = flights.filter((f) =>
    (f.uavId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.missionType || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Flight Logbook</h1>
            <p className="text-xs text-slate-500">Flight history and performance reports</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by UAV or mission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 w-72 transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
        {[
          { icon: Plane, label: 'Total Flights', value: flights.length, color: 'text-cyan-400' },
          { icon: Clock, label: 'Flight Hours', value: flights.reduce((sum, f) => sum + (f.durationMin || 0), 0).toFixed(0) + ' min', color: 'text-emerald-400' },
          { icon: MapPin, label: 'Distance Covered', value: flights.reduce((sum, f) => sum + (f.distanceKm || 0), 0).toFixed(1) + ' km', color: 'text-amber-400' },
          { icon: Calendar, label: 'Last Flight', value: flights[0]?.date || '—', color: 'text-blue-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <span className="text-lg font-bold text-slate-100 font-mono">{value}</span>
          </div>
        ))}
      </div>

      {/* Flight Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">UAV</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mission</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Distance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Alt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((flight, idx) => (
                  <tr key={flight.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">{flight.date || '—'}</td>
                    <td className="px-4 py-3 text-xs text-cyan-400 font-semibold">{flight.uavId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{flight.missionType || 'Standard'}</td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">{flight.durationMin ?? '—'} min</td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">{flight.distanceKm?.toFixed(1) ?? '—'} km</td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">{flight.maxAltitudeM ?? '—'} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <FileText className="w-10 h-10 mb-3 text-slate-600" />
            <p className="text-sm font-medium">
              {flights.length === 0 ? 'No flight records' : `No results for "${searchQuery}"`}
            </p>
            <p className="text-xs mt-1">Flight logs will appear here after missions</p>
          </div>
        )}
      </div>
    </div>
  );
}
