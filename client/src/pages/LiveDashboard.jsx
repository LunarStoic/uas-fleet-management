// =============================================================================
// LiveDashboard — Split-Pane Map + Telemetry View
// =============================================================================
// Main dashboard page with UAVDesk-inspired split layout:
//   Left (flex-1):  Live map with real-time drone positions
//   Right (400px):  Telemetry widget + Active orders panel
//
// This page does NOT initialize WebSocket — that's handled in DashboardLayout.
// =============================================================================

import LiveMap from '../components/map/LiveMap';
import TelemetryWidget from '../components/dashboard/TelemetryWidget';
import ActiveOrders from '../components/dashboard/ActiveOrders';

export default function LiveDashboard() {
  return (
    <div className="flex h-full w-full gap-0">
      {/* ── Left Panel: Live Map (takes remaining space) ── */}
      <div className="flex-1 min-w-0 relative">
        <LiveMap />

        {/* Floating title overlay on map */}
        <div className="absolute top-4 left-4 z-[500]">
          <div className="glass-panel px-4 py-2 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Live Tracking
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Telemetry + Orders (fixed 400px) ── */}
      <div className="w-[400px] shrink-0 flex flex-col gap-3 p-3 overflow-y-auto bg-slate-900/80 border-l border-slate-800">
        <TelemetryWidget />
        <ActiveOrders />
      </div>
    </div>
  );
}
