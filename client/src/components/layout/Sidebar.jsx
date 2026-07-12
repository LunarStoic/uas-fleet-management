// =============================================================================
// Sidebar — Navigation Component
// =============================================================================
// Fixed left sidebar with icon navigation links. Inspired by UAVDesk's
// minimal sidebar design — icons only with labels visible on hover/active.
//
// ROUTES:
//   /           → Live Dashboard (map + telemetry)
//   /fleet      → Fleet Configuration
//   /orders     → Order Logistics
//   /logbook    → Flight History / Reports
// =============================================================================

import { NavLink } from 'react-router-dom';
import {
  Map,
  Plane,
  Package,
  BarChart3,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import useTelemetryStore from '../../store/useTelemetryStore';

/** Navigation items — each becomes a sidebar link */
const navItems = [
  { to: '/', icon: Map, label: 'Live Map' },
  { to: '/fleet', icon: Plane, label: 'Fleet' },
  { to: '/orders', icon: Package, label: 'Orders' },
  { to: '/logbook', icon: BarChart3, label: 'Reports' },
];

export default function Sidebar() {
  // Subscribe to connection status — only this slice, not the entire store
  const connectionStatus = useTelemetryStore((s) => s.connectionStatus);

  /** Determine connection indicator color */
  const statusColor = {
    connected: 'bg-emerald-400',
    reconnecting: 'bg-amber-400 animate-pulse',
    disconnected: 'bg-red-400',
  }[connectionStatus] || 'bg-slate-500';

  const StatusIcon = connectionStatus === 'connected' ? Wifi : WifiOff;

  return (
    <aside className="flex flex-col w-16 hover:w-48 group/sidebar bg-[var(--color-sidebar-bg)] border-r border-slate-800 transition-all duration-300 overflow-hidden shrink-0">
      {/* ── Logo Area ── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800">
        <Radio className="w-6 h-6 text-cyan-400 shrink-0" />
        <span className="text-sm font-bold text-slate-100 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
          UAS Fleet
        </span>
      </div>

      {/* ── Navigation Links ── */}
      <nav className="flex-1 flex flex-col gap-1 p-2 mt-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-sm whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* ── Connection Status ── */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <StatusIcon className="w-5 h-5 text-slate-400" />
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-sidebar-bg)] ${statusColor}`} />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 capitalize">
            {connectionStatus}
          </span>
        </div>
      </div>
    </aside>
  );
}
