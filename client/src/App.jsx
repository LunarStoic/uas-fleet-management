// =============================================================================
// App.jsx — Route Definitions (React Router v6)
// =============================================================================
// Defines the application's route structure using React Router.
// All routes are wrapped in DashboardLayout which provides:
//   1. The sidebar navigation
//   2. The WebSocket connection (initialized once)
//
// ROUTE MAP:
//   /         → LiveDashboard (map + telemetry split-pane)
//   /fleet    → FleetConfig (drone cards + diff tool)
//   /orders   → OrderLogistics (CRUD + status tabs)
//   /logbook  → Logbook (flight history table)
// =============================================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import LiveDashboard from './pages/LiveDashboard';
import FleetConfig from './pages/FleetConfig';
import OrderLogistics from './pages/OrderLogistics';
import Logbook from './pages/Logbook';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All routes share the DashboardLayout (sidebar + WebSocket) */}
        <Route element={<DashboardLayout />}>
          <Route index element={<LiveDashboard />} />
          <Route path="/fleet" element={<FleetConfig />} />
          <Route path="/orders" element={<OrderLogistics />} />
          <Route path="/logbook" element={<Logbook />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
