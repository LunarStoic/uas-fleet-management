// =============================================================================
// LiveMap — Leaflet Map Component (Real-Time Drone Tracking)
// =============================================================================
// Renders an interactive map using react-leaflet with dark tile layer
// (CartoDB Dark Matter). Subscribes to useTelemetryStore to display
// drone positions as custom markers.
//
// PERFORMANCE — RENDER ISOLATION:
//   This component uses React.memo to prevent re-renders from parent.
//   It subscribes ONLY to the `drones` slice of the telemetry store.
//   Typing in an order form or navigating pages will NOT cause this
//   component to re-render.
//
// MAP LAYER:
//   CartoDB Dark Matter — a dark basemap that matches the dashboard theme.
//   Free for non-commercial use, no API key required.
// =============================================================================

import { memo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import useTelemetryStore from '../../store/useTelemetryStore';
import DroneMarker from './DroneMarker';

// Map center: Medan, North Sumatra, Indonesia (matches SITL simulator)
const DEFAULT_CENTER = [3.5952, 98.6722];
const DEFAULT_ZOOM = 14;

// CartoDB Dark Matter tile URL — dark basemap for aerospace UI
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a>';

function LiveMap() {
  // Subscribe to ONLY the drones object — isolated from order state
  const drones = useTelemetryStore((s) => s.drones);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full z-0"
      zoomControl={true}
      attributionControl={true}
    >
      {/* Dark tile layer */}
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

      {/* Render a marker for each tracked drone */}
      {Object.entries(drones).map(([uavId, data]) => (
        <DroneMarker key={uavId} uavId={uavId} data={data} />
      ))}
    </MapContainer>
  );
}

// memo prevents parent re-renders from affecting the map
export default memo(LiveMap);
