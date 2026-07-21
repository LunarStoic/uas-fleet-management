// =============================================================================
// Sidebar — Premium Aerospace Navigation
// =============================================================================

import { NavLink } from 'react-router-dom';
import {
  Map, Plane, Package, BookOpen, Radio,
  Wifi, WifiOff, Activity,
} from 'lucide-react';
import useTelemetryStore from '../../store/useTelemetryStore';

const navItems = [
  { to: '/',        icon: Map,      label: 'Live Map',    color: 'text-cyan-400',   glow: 'rgba(34,211,238,0.15)' },
  { to: '/fleet',   icon: Plane,    label: 'Fleet',       color: 'text-blue-400',   glow: 'rgba(96,165,250,0.15)' },
  { to: '/orders',  icon: Package,  label: 'Orders',      color: 'text-violet-400', glow: 'rgba(167,139,250,0.15)' },
  { to: '/logbook', icon: BookOpen, label: 'Logbook',     color: 'text-emerald-400',glow: 'rgba(52,211,153,0.15)' },
];

export default function Sidebar() {
  const connectionStatus = useTelemetryStore((s) => s.connectionStatus);

  const StatusIcon = connectionStatus === 'connected' ? Wifi : WifiOff;
  const statusDot = {
    connected:    'bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]',
    reconnecting: 'bg-amber-400 animate-pulse',
    disconnected: 'bg-red-400',
  }[connectionStatus] || 'bg-slate-500';

  const statusLabel = {
    connected:    'LIVE',
    reconnecting: 'SYNC',
    disconnected: 'OFFLINE',
  }[connectionStatus] || '—';

  return (
    <aside className="group/sidebar flex flex-col w-[60px] hover:w-52 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 overflow-hidden border-r border-slate-800/80"
      style={{ background: 'linear-gradient(180deg, #080e1a 0%, #060c18 100%)' }}>

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 h-16 px-[18px] border-b border-slate-800/60 shrink-0">
        <div className="relative shrink-0">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]" />
        </div>
        <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap min-w-0">
          <p className="text-sm font-bold text-slate-100 leading-tight">UAS Fleet</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Control Hub</p>
        </div>
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 flex flex-col gap-1 p-2 pt-3">
        {navItems.map(({ to, icon: Icon, label, color, glow }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-link group/navitem ${isActive ? 'nav-link-active' : ''}`
            }
            style={({ isActive }) => isActive ? { background: glow } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? color : 'text-slate-500 group-hover/navitem:text-slate-300'}`} />
                <span className={`text-sm font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 ${isActive ? color : ''}`}>
                  {label}
                </span>
                {/* Active glow dot */}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-3 border-t border-slate-800/60" />

      {/* ── Connection Status ── */}
      <div className="p-3 pb-4 shrink-0">
        <div className="flex items-center gap-3 px-1">
          <div className="relative shrink-0">
            <StatusIcon className="w-4 h-4 text-slate-500" />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#080e1a] ${statusDot}`} />
          </div>
          <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <p className="text-[10px] font-bold tracking-widest text-slate-400">{statusLabel}</p>
            <p className="text-[9px] text-slate-600 capitalize">{connectionStatus}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
