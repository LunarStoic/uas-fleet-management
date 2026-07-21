// =============================================================================
// Logbook — Flight History & Analytics (Premium Redesign)
// =============================================================================

import { useState, useEffect } from 'react';
import {
  BookOpen, Calendar, Clock, Plane, MapPin, Loader2,
  Download, FileText, Search, TrendingUp, Zap, Wind,
} from 'lucide-react';
import api from '../config/api';

export default function Logbook() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/reports/flights')
      .then((r) => setFlights(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = flights.filter((f) =>
    (f.uavId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.missionType || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMins = flights.reduce((s, f) => s + (f.durationMin || f.flightDurationMins || 0), 0);
  const totalKm   = flights.reduce((s, f) => s + (f.distanceKm || f.distanceCoveredKm || 0), 0);

  const MISSION_STYLE = {
    DELIVERY:    'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20',
    MAPPING:     'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
    TEST_FLIGHT: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#060d1a' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(52,211,153,0.12)' }}>
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">Flight Logbook</h1>
            <p className="text-xs text-slate-500">Historical flight analytics & reporting</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search UAV or mission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-input pl-9 w-56 text-xs"
            />
          </div>
          <button className="btn-ghost text-xs">
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button className="btn-ghost text-xs">
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-4 gap-3 px-6 pt-4 pb-0 shrink-0">
        {[
          { icon: Plane,     label: 'Total Flights',  value: flights.length,               color: 'text-cyan-400',    glow: 'rgba(34,211,238,0.1)' },
          { icon: Clock,     label: 'Total Time',     value: `${Math.floor(totalMins/60)}h ${(totalMins%60).toFixed(0)}m`, color: 'text-emerald-400', glow: 'rgba(52,211,153,0.1)' },
          { icon: MapPin,    label: 'Total Distance', value: `${totalKm.toFixed(1)} km`,   color: 'text-amber-400',  glow: 'rgba(251,191,36,0.1)' },
          { icon: TrendingUp,label: 'Avg Duration',   value: flights.length ? `${(totalMins / flights.length).toFixed(0)} min` : '—', color: 'text-violet-400', glow: 'rgba(167,139,250,0.1)' },
        ].map(({ icon: Icon, label, value, color, glow }) => (
          <div key={label} className="glass-panel p-4"
            style={{ boxShadow: `inset 0 0 30px -10px ${glow}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{label}</span>
            </div>
            <p className={`text-xl font-bold font-mono ${color}`}>{value === 0 ? '0' : value || '—'}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 skeleton rounded-xl" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="glass-panel overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th><Calendar className="w-3 h-3 inline mr-1" />Date</th>
                  <th>UAV</th>
                  <th>Mission</th>
                  <th><Wind className="w-3 h-3 inline mr-1" />Weather</th>
                  <th>Distance</th>
                  <th><Zap className="w-3 h-3 inline mr-1" />Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((flight, idx) => {
                  const mStyle = MISSION_STYLE[flight.missionType] || 'bg-slate-700/30 text-slate-400';
                  return (
                    <tr key={flight.id || idx}>
                      <td>
                        <span className="text-xs font-mono text-slate-300">
                          {flight.date || flight.flightDate
                            ? new Date(flight.date || flight.flightDate).toLocaleDateString()
                            : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                            <Plane className="w-3 h-3 text-cyan-400" />
                          </div>
                          <span className="text-xs font-bold text-cyan-400">{flight.uavId || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${mStyle}`}>
                          {flight.missionType?.replace(/_/g, ' ') || 'Standard'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-400">
                          {flight.weatherCondition || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-300">
                          {(flight.distanceKm ?? flight.distanceCoveredKm)?.toFixed(1) ?? '—'} km
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-300">
                          {(flight.durationMin ?? flight.flightDurationMins) ?? '—'} min
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-60">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-slate-700" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              {flights.length === 0 ? 'No flight records yet' : `No results for "${searchQuery}"`}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {flights.length === 0
                ? 'Flight logs appear here after missions complete'
                : 'Try a different search term'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
