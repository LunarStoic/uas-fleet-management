// =============================================================================
// TelemetryWidget — Real-Time Drone Telemetry Panel
// =============================================================================
// Glassmorphism card displaying live telemetry data for the first (or selected)
// active drone. Shows battery gauge, altitude, speed, heading, and flight mode.
//
// SUBSCRIBES TO: useTelemetryStore (drones, connectionStatus)
// DOES NOT SUBSCRIBE TO: useOrderStore (prevents cross-render leaks)
// =============================================================================

import { memo } from 'react';
import {
  Battery,
  Gauge,
  Navigation,
  ArrowUp,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import useTelemetryStore from '../../store/useTelemetryStore';

/**
 * Circular battery gauge — SVG arc visualization.
 */
function BatteryGauge({ percentage = 0 }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let color = '#34d399'; // emerald
  if (percentage <= 20) color = '#f87171'; // red
  else if (percentage <= 60) color = '#fbbf24'; // amber

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90">
        {/* Background track */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke="#334155" strokeWidth="6"
        />
        {/* Filled arc */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Battery className="w-4 h-4 mb-0.5" style={{ color }} />
        <span className="text-lg font-bold font-mono" style={{ color }}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

/**
 * Single telemetry metric display.
 */
function MetricRow({ icon: Icon, label, value, unit, color = 'text-slate-300' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className={`font-mono text-sm font-semibold ${color}`}>
        {value} <span className="text-xs text-slate-500 font-normal">{unit}</span>
      </span>
    </div>
  );
}

function TelemetryWidget() {
  const drones = useTelemetryStore((s) => s.drones);
  const connectionStatus = useTelemetryStore((s) => s.connectionStatus);

  // Get first active drone for display (future: user-selectable)
  const droneEntries = Object.entries(drones);
  const activeDrone = droneEntries.length > 0 ? droneEntries[0] : null;

  const isConnected = connectionStatus === 'connected';

  return (
    <div className="glass-panel p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Telemetry</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
          isConnected
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          {isConnected
            ? <Wifi className="w-3 h-3" />
            : <WifiOff className="w-3 h-3" />
          }
          <span className="capitalize">{connectionStatus}</span>
        </div>
      </div>

      {activeDrone ? (
        <>
          {/* UAV ID + Flight Mode */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
              {activeDrone[0]}
            </span>
            <span className="badge badge-routed">
              {activeDrone[1].flightMode || 'N/A'}
            </span>
          </div>

          {/* Battery Gauge - Centered */}
          <div className="flex justify-center mb-4">
            <BatteryGauge percentage={activeDrone[1].battery?.percentage ?? 0} />
          </div>

          {/* Metrics */}
          <div className="space-y-0">
            <MetricRow
              icon={ArrowUp}
              label="Altitude"
              value={activeDrone[1].position?.altitude?.toFixed(1) ?? '—'}
              unit="m"
            />
            <MetricRow
              icon={Gauge}
              label="Speed"
              value={activeDrone[1].velocity?.groundSpeed?.toFixed(1) ?? '—'}
              unit="m/s"
            />
            <MetricRow
              icon={Navigation}
              label="Heading"
              value={activeDrone[1].velocity?.heading?.toFixed(0) ?? '—'}
              unit="°"
            />
          </div>
        </>
      ) : (
        /* Empty state when no drones are connected */
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <AlertTriangle className="w-8 h-8 mb-2 text-slate-600" />
          <p className="text-sm font-medium">No telemetry data</p>
          <p className="text-xs mt-1">Waiting for drone connection...</p>
        </div>
      )}
    </div>
  );
}

export default memo(TelemetryWidget);
