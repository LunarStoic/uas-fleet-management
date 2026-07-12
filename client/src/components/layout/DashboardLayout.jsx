// =============================================================================
// Dashboard Layout — App Shell with Sidebar + Content (Outlet)
// =============================================================================
// This is the root layout component. It:
//   1. Renders the Sidebar (navigation)
//   2. Renders the active page via React Router's <Outlet />
//   3. Initializes the WebSocket connection (ONE connection for the entire app)
//
// The WebSocket hook is called here (at the top level) so the telemetry
// connection persists across page navigation — not re-created on each route.
// =============================================================================

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useDroneWebSocket from '../../hooks/useDroneWebSocket';

export default function DashboardLayout() {
  // Initialize WebSocket — connects on mount, auto-reconnects on failure
  useDroneWebSocket();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content area — each page fills this via <Outlet /> */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
