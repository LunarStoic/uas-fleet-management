// =============================================================================
// DroneMarker — Custom Leaflet Marker for UAV Position
// =============================================================================
// Renders a custom drone icon on the Leaflet map for each tracked UAV.
// The icon rotates based on the drone's heading and changes color based
// on battery level (green → yellow → red).
//
// PERFORMANCE:
//   Uses React.memo to prevent re-renders when other drones update.
//   Only re-renders when THIS drone's data changes.
// =============================================================================

import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * Get battery color based on percentage level.
 * Green (>60%) → Yellow (>20%) → Red (≤20%)
 */
function getBatteryColor(percentage) {
  if (percentage > 60) return '#34d399'; // emerald-400
  if (percentage > 20) return '#fbbf24'; // amber-400
  return '#f87171'; // red-400
}

/**
 * Creates a rotatable drone SVG icon for Leaflet.
 *
 * @param {number} heading - Compass heading in degrees (0-360)
 * @param {string} color - Fill color for the drone body
 * @returns {L.DivIcon} Leaflet DivIcon with inline SVG
 */
function createDroneIcon(heading = 0, color = '#22d3ee') {
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"
         style="transform: rotate(${heading}deg); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <path d="M16 4 L22 14 L20 16 L22 26 L16 22 L10 26 L12 16 L10 14 Z"
            fill="${color}" fill-opacity="0.9" stroke="${color}" stroke-width="0.5"/>
      <circle cx="16" cy="14" r="2" fill="white" fill-opacity="0.8"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: '', // Remove default Leaflet icon styling
  });
}

/**
 * DroneMarker component — renders a single drone on the map.
 *
 * @param {Object} props
 * @param {string} props.uavId - Unique drone identifier
 * @param {Object} props.data - Telemetry data { position, velocity, battery, flightMode, armed }
 */
function DroneMarker({ uavId, data }) {
  const { position, velocity, battery, flightMode, armed } = data;

  // Guard: Skip rendering if position data is missing
  if (!position?.latitude || !position?.longitude) return null;

  const batteryPct = battery?.percentage ?? 0;
  const heading = velocity?.heading ?? 0;
  const color = getBatteryColor(batteryPct);
  const icon = createDroneIcon(heading, color);

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={icon}
    >
      <Popup className="drone-popup">
        <div className="min-w-[200px] p-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">{uavId}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              armed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {armed ? 'ARMED' : 'DISARMED'}
            </span>
          </div>

          {/* Telemetry Details */}
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Altitude</span>
              <span className="font-mono">{position.altitude?.toFixed(1)}m</span>
            </div>
            <div className="flex justify-between">
              <span>Speed</span>
              <span className="font-mono">{velocity?.groundSpeed?.toFixed(1)} m/s</span>
            </div>
            <div className="flex justify-between">
              <span>Battery</span>
              <span className="font-mono" style={{ color }}>
                {batteryPct.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mode</span>
              <span className="font-semibold">{flightMode || 'N/A'}</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default memo(DroneMarker);
