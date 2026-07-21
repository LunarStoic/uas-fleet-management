// =============================================================================
// FleetConfig — Fleet Management Hub (3-Tab Architecture)
// =============================================================================
// TAB 1: Inventory & Configuration  — UAV data grid + Register form
// TAB 2: Maintenance & MRO          — Health dashboard + maintenance history
// TAB 3: Flight Logbook             — Flight records + CSV/PDF export mock
//
// DATA CONTRACTS (per Phase 1 spec):
//   UAV:              id, callsign, modelType, maxPayloadKg, maxFlightTimeMinutes,
//                     cruisingSpeedMs, firmwareVersion, currentBatteryCycles,
//                     totalFlightHours, status
//   Maintenance_Log:  id, uavId, maintenanceDate, maintenanceType, description,
//                     technicianName, nextDueDate
//   Flight_Logbook:   id, uavId, flightDate, missionType, weatherCondition,
//                     distanceCoveredKm, flightDurationMins
// =============================================================================

import { useState } from 'react';
import {
  Plane, Wrench, BookOpen, Plus, X, Loader2,
  Battery, Clock, Gauge, AlertTriangle, CheckCircle2,
  Download, FileText, ChevronRight, Cpu,
  ShieldCheck, Zap, Activity, Database, FlaskConical,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEMO_UUID = '550e8400-e29b-41d4-a716-446655440000';

const DEMO_UAV = {
  id: DEMO_UUID,
  callsign: 'FALCON-01',
  modelType: 'VTOL',
  maxPayloadKg: 5.5,
  maxFlightTimeMinutes: 65,
  cruisingSpeedMs: 18.0,
  firmwareVersion: 'ArduPilot v4.3.0',
  currentBatteryCycles: 278,
  totalFlightHours: 312.4,
  status: 'AVAILABLE',
};

const DEMO_MAINTENANCE = {
  id: '7f3b1a2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
  uavId: DEMO_UUID,
  maintenanceDate: '2026-07-10T09:00:00Z',
  maintenanceType: 'BATTERY_REPLACEMENT',
  description: 'Replaced primary LiPo battery pack. Capacity restored to 100%. Cell balance checked.',
  technicianName: 'Andi Prasetyo',
  nextDueDate: '2026-10-10T09:00:00Z',
};

const DEMO_FLIGHT = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  uavId: DEMO_UUID,
  flightDate: '2026-07-16T08:30:00Z',
  missionType: 'DELIVERY',
  weatherCondition: 'Clear',
  distanceCoveredKm: 12.7,
  flightDurationMins: 38,
};

const UAV_STATUSES = ['AVAILABLE', 'IN_TRANSIT', 'CHARGING', 'MAINTENANCE', 'RETIRED'];
const UAV_MODELS = ['QUADCOPTER', 'HEXACOPTER', 'VTOL'];
const MAINTENANCE_TYPES = ['ROUTINE_CHECK', 'BATTERY_REPLACEMENT', 'MOTOR_REPAIR', 'FIRMWARE_UPDATE'];
const MISSION_TYPES = ['DELIVERY', 'MAPPING', 'TEST_FLIGHT'];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const STATUS_CFG = {
  AVAILABLE:   { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Available' },
  IN_TRANSIT:  { dot: 'bg-blue-400',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'In Transit' },
  CHARGING:    { dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'Charging' },
  MAINTENANCE: { dot: 'bg-orange-400',  text: 'text-orange-400',  bg: 'bg-orange-500/10',  label: 'Maintenance' },
  RETIRED:     { dot: 'bg-slate-500',   text: 'text-slate-400',   bg: 'bg-slate-500/10',   label: 'Retired' },
};

const MTYPE_CFG = {
  ROUTINE_CHECK:     { icon: ShieldCheck, color: 'text-cyan-400' },
  BATTERY_REPLACEMENT: { icon: Battery,  color: 'text-amber-400' },
  MOTOR_REPAIR:      { icon: Wrench,     color: 'text-orange-400' },
  FIRMWARE_UPDATE:   { icon: Cpu,        color: 'text-blue-400' },
};

const inputCls = 'field-input';

const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest';

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.AVAILABLE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{title}</h3>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Inventory & Configuration
// ---------------------------------------------------------------------------

function AddUavModal({ isOpen, onClose, onAdd }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    callsign: '', modelType: 'QUADCOPTER', maxPayloadKg: '',
    maxFlightTimeMinutes: '', cruisingSpeedMs: '', firmwareVersion: '',
    status: 'AVAILABLE',
  });

  if (!isOpen) return null;

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        id: crypto.randomUUID(),
        maxPayloadKg: parseFloat(form.maxPayloadKg) || 0,
        maxFlightTimeMinutes: parseFloat(form.maxFlightTimeMinutes) || 0,
        cruisingSpeedMs: parseFloat(form.cruisingSpeedMs) || 0,
        currentBatteryCycles: 0,
        totalFlightHours: 0,
      };
      onAdd(payload);
      onClose();
      setForm({ callsign: '', modelType: 'QUADCOPTER', maxPayloadKg: '', maxFlightTimeMinutes: '', cruisingSpeedMs: '', firmwareVersion: '', status: 'AVAILABLE' });
    } catch (err) {
      setError('Failed to register UAV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg mx-4 p-6 overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Register New UAV</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Callsign *</label>
              <input type="text" required placeholder="e.g. FALCON-01" value={form.callsign} onChange={f('callsign')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Model Type *</label>
              <select value={form.modelType} onChange={f('modelType')} className={inputCls}>
                {UAV_MODELS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={f('status')} className={inputCls}>
                {UAV_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Specs */}
          <div>
            <label className={labelCls}>Performance Specs</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input type="number" step="any" placeholder="Max Payload (kg)" value={form.maxPayloadKg} onChange={f('maxPayloadKg')} className={inputCls} />
              </div>
              <div>
                <input type="number" step="any" placeholder="Max Flight (min)" value={form.maxFlightTimeMinutes} onChange={f('maxFlightTimeMinutes')} className={inputCls} />
              </div>
              <div>
                <input type="number" step="any" placeholder="Cruise Speed (m/s)" value={form.cruisingSpeedMs} onChange={f('cruisingSpeedMs')} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Firmware */}
          <div>
            <label className={labelCls}>Firmware Version</label>
            <input type="text" placeholder="e.g. ArduPilot v4.3.0" value={form.firmwareVersion} onChange={f('firmwareVersion')} className={inputCls} />
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center py-2.5 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Registering...' : 'Register UAV'}
          </button>
        </form>
      </div>
    </div>
  );
}

function InventoryTab({ uavs, setUavs }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <SectionHeader
        title="UAV Inventory"
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-3 py-1.5">
            <Plus className="w-3.5 h-3.5" /> Add UAV
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        {uavs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Plane className="w-10 h-10 mb-3 text-slate-700" />
            <p className="text-sm">No UAVs registered</p>
            <p className="text-xs mt-1">Click "Add UAV" or use "Load Demo Data"</p>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Callsign', 'Model', 'Max Payload', 'Flight Time', 'Firmware Version', 'Battery Cycles', 'Status'].map((h) => (
                    <th key={h} className="whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uavs.map((uav) => (
                  <tr key={uav.id} className="group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                          <Plane className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="font-bold text-slate-200 text-xs group-hover:text-cyan-400 transition-colors">{uav.callsign}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono text-[11px]">{uav.modelType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">{uav.maxPayloadKg ?? '—'} kg</td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">{uav.maxFlightTimeMinutes ?? '—'} min</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="text-xs text-blue-300 font-mono">{uav.firmwareVersion || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {uav.currentBatteryCycles > 250
                          ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                          : <Battery className="w-3 h-3 text-emerald-400 shrink-0" />}
                        <span className={`text-xs font-mono font-bold ${uav.currentBatteryCycles > 250 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {uav.currentBatteryCycles ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={uav.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddUavModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={(uav) => setUavs((p) => [uav, ...p])} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Maintenance & MRO
// ---------------------------------------------------------------------------

function LogMaintenanceModal({ isOpen, onClose, onAdd, uavs }) {
  const [form, setForm] = useState({
    uavId: '', maintenanceDate: '', maintenanceType: 'ROUTINE_CHECK',
    description: '', technicianName: '', nextDueDate: '',
  });

  if (!isOpen) return null;

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...form, id: crypto.randomUUID() });
    onClose();
    setForm({ uavId: '', maintenanceDate: '', maintenanceType: 'ROUTINE_CHECK', description: '', technicianName: '', nextDueDate: '' });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg mx-4 p-6 overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Log Maintenance Entry</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>UAV *</label>
            <select required value={form.uavId} onChange={f('uavId')} className={inputCls}>
              <option value="">Select UAV...</option>
              {uavs.map((u) => <option key={u.id} value={u.id}>{u.callsign}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Maintenance Date *</label>
              <input type="datetime-local" required value={form.maintenanceDate} onChange={f('maintenanceDate')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Next Due Date</label>
              <input type="datetime-local" value={form.nextDueDate} onChange={f('nextDueDate')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Maintenance Type *</label>
            <select required value={form.maintenanceType} onChange={f('maintenanceType')} className={inputCls}>
              {MAINTENANCE_TYPES.map((t) => <option key={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Technician Name *</label>
            <input type="text" required placeholder="e.g. Andi Prasetyo" value={form.technicianName} onChange={f('technicianName')} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} placeholder="Describe the maintenance activity..." value={form.description} onChange={f('description')}
              className={`${inputCls} resize-none`} />
          </div>

          <button type="submit"
            className="btn-primary w-full justify-center py-2.5" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',boxShadow:'0 4px 14px -4px rgba(245,158,11,0.35)'}}>
            <Plus className="w-4 h-4" /> Log Entry
          </button>
        </form>
      </div>
    </div>
  );
}

function BatteryMeter({ cycles }) {
  const pct = Math.min(100, (cycles / 300) * 100);
  const danger = cycles > 250;
  const warn = cycles > 180;
  const color = danger ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-400';
  const textColor = danger ? 'text-red-400' : warn ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">Battery Cycles</span>
        <div className="flex items-center gap-1.5">
          {danger && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
          <span className={`text-sm font-bold font-mono ${textColor}`}>{cycles} / 300</span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {danger && (
        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Replacement recommended — cycles exceed safety threshold
        </p>
      )}
    </div>
  );
}

function MaintenanceTab({ uavs, maintenanceLogs, setMaintenanceLogs }) {
  const [selectedUavId, setSelectedUavId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedUav = uavs.find((u) => u.id === selectedUavId);
  const uavLogs = maintenanceLogs.filter((l) => l.uavId === selectedUavId);

  return (
    <div className="flex gap-4 h-full">
      {/* Left: Asset Selector */}
      <div className="w-56 shrink-0 flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Asset</p>
        {uavs.length === 0 ? (
          <div className="glass-panel p-4 text-center text-xs text-slate-500">No UAVs registered</div>
        ) : (
          uavs.map((uav) => (
            <button key={uav.id} onClick={() => setSelectedUavId(uav.id)}
              className={`glass-panel p-3 text-left transition-all duration-200 ${selectedUavId === uav.id ? 'border-cyan-500/50 bg-cyan-500/5' : 'hover:border-slate-600'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold ${selectedUavId === uav.id ? 'text-cyan-400' : 'text-slate-200'}`}>{uav.callsign}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{uav.modelType}</p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-colors ${selectedUavId === uav.id ? 'text-cyan-400' : 'text-slate-600'}`} />
              </div>
              <StatusBadge status={uav.status} />
            </button>
          ))
        )}
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {!selectedUav ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Activity className="w-12 h-12 mb-3 text-slate-700" />
            <p className="text-sm">Select a UAV to view health data</p>
          </div>
        ) : (
          <>
            {/* Health Dashboard */}
            <div className="glass-panel p-4 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-200">Health Dashboard — {selectedUav.callsign}</h3>
                </div>
                <StatusBadge status={selectedUav.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Battery Cycles */}
                <div className="col-span-2">
                  <BatteryMeter cycles={selectedUav.currentBatteryCycles} />
                </div>

                {/* Metric cards */}
                {[
                  { icon: Clock, label: 'Total Flight Hours', value: `${selectedUav.totalFlightHours?.toFixed(1)} hrs`, color: 'text-cyan-400' },
                  { icon: Gauge, label: 'Cruise Speed', value: `${selectedUav.cruisingSpeedMs} m/s`, color: 'text-blue-400' },
                  { icon: Cpu, label: 'Firmware', value: selectedUav.firmwareVersion || '—', color: 'text-violet-400' },
                  { icon: Database, label: 'Max Payload', value: `${selectedUav.maxPayloadKg} kg`, color: 'text-emerald-400' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <span className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-200 font-mono">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Maintenance History */}
            <div className="glass-panel p-4 flex-1 min-h-0 flex flex-col">
              <SectionHeader
                title="Maintenance History"
                action={
                  <button onClick={() => setModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors">
                    <Plus className="w-3 h-3" /> Log Maintenance
                  </button>
                }
              />
              <div className="flex-1 overflow-y-auto min-h-0">
                {uavLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mb-2 text-slate-700" />
                    <p className="text-xs">No maintenance records for this UAV</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        {['Date', 'Type', 'Technician', 'Description', 'Next Due'].map((h) => (
                          <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {uavLogs.map((log) => {
                        const cfg = MTYPE_CFG[log.maintenanceType] || MTYPE_CFG.ROUTINE_CHECK;
                        return (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-3 py-2.5 text-xs text-slate-300 font-mono whitespace-nowrap">
                              {log.maintenanceDate ? new Date(log.maintenanceDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                                <span className="text-xs text-slate-300 whitespace-nowrap">{log.maintenanceType?.replace(/_/g, ' ')}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">{log.technicianName || '—'}</td>
                            <td className="px-3 py-2.5 text-xs text-slate-500 max-w-xs truncate">{log.description || '—'}</td>
                            <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">
                              {log.nextDueDate ? (
                                <span className="text-amber-400">{new Date(log.nextDueDate).toLocaleDateString()}</span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <LogMaintenanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        uavs={uavs}
        onAdd={(log) => {
          setMaintenanceLogs((p) => [log, ...p]);
          // Pre-select the UAV of the newly logged entry
          if (log.uavId) setSelectedUavId(log.uavId);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Flight Logbook
// ---------------------------------------------------------------------------

function AddFlightModal({ isOpen, onClose, onAdd, uavs }) {
  const [form, setForm] = useState({
    uavId: '', flightDate: '', missionType: 'DELIVERY',
    weatherCondition: '', distanceCoveredKm: '', flightDurationMins: '',
  });

  if (!isOpen) return null;

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...form,
      id: crypto.randomUUID(),
      distanceCoveredKm: parseFloat(form.distanceCoveredKm) || 0,
      flightDurationMins: parseFloat(form.flightDurationMins) || 0,
    });
    onClose();
    setForm({ uavId: '', flightDate: '', missionType: 'DELIVERY', weatherCondition: '', distanceCoveredKm: '', flightDurationMins: '' });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg mx-4 p-6 overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <h2 className="text-base font-bold text-slate-100">Add Flight Record</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4 p-2 rounded bg-slate-800/60 border border-slate-700/40">
          ℹ️ In production, flight records are populated automatically by the telemetry-gateway at mission end. This form is for manual historical input.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>UAV *</label>
              <select required value={form.uavId} onChange={f('uavId')} className={inputCls}>
                <option value="">Select UAV...</option>
                {uavs.map((u) => <option key={u.id} value={u.id}>{u.callsign}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Flight Date *</label>
              <input type="datetime-local" required value={form.flightDate} onChange={f('flightDate')} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Mission Type *</label>
              <select required value={form.missionType} onChange={f('missionType')} className={inputCls}>
                {MISSION_TYPES.map((t) => <option key={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Weather Condition</label>
              <input type="text" placeholder="e.g. Clear, Windy, Overcast" value={form.weatherCondition} onChange={f('weatherCondition')} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Distance Covered (km)</label>
              <input type="number" step="any" placeholder="e.g. 12.7" value={form.distanceCoveredKm} onChange={f('distanceCoveredKm')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Duration (minutes)</label>
              <input type="number" step="any" placeholder="e.g. 38" value={form.flightDurationMins} onChange={f('flightDurationMins')} className={inputCls} />
            </div>
          </div>

          <button type="submit"
            className="btn-primary w-full justify-center py-2.5" style={{background:'linear-gradient(135deg,#a78bfa,#7c3aed)',boxShadow:'0 4px 14px -4px rgba(167,139,250,0.35)'}}>
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </form>
      </div>
    </div>
  );
}

function LogbookTab({ uavs, flightLogs, setFlightLogs }) {
  const [modalOpen, setModalOpen] = useState(false);

  const getCallsign = (uavId) => uavs.find((u) => u.id === uavId)?.callsign || uavId?.slice(0, 8) || '—';

  const totalDistance = flightLogs.reduce((s, f) => s + (f.distanceCoveredKm || 0), 0);
  const totalMins = flightLogs.reduce((s, f) => s + (f.flightDurationMins || 0), 0);

  const WEATHER_ICONS = { Clear: '☀️', Windy: '💨', Overcast: '☁️', Rain: '🌧️', Stormy: '⛈️' };

  return (
    <div className="flex flex-col h-full">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
        {[
          { label: 'Total Flights', value: flightLogs.length, icon: BookOpen, color: 'text-violet-400' },
          { label: 'Total Distance', value: `${totalDistance.toFixed(1)} km`, icon: Activity, color: 'text-cyan-400' },
          { label: 'Total Flight Time', value: `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`, icon: Clock, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-panel p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-bold text-slate-100 font-mono">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table header actions */}
      <SectionHeader
        title="Flight Records"
        action={
          <div className="flex items-center gap-2">
            {/* Export mock buttons */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600 text-xs text-slate-300 hover:text-red-400 hover:border-red-500/30 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400 hover:bg-violet-500/20 transition-colors">
              <Plus className="w-3 h-3" /> Add Flight Record
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        {flightLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <BookOpen className="w-10 h-10 mb-3 text-slate-700" />
            <p className="text-sm">No flight records</p>
            <p className="text-xs mt-1">Records are auto-created by the telemetry-gateway or added manually</p>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'UAV', 'Mission', 'Weather', 'Distance', 'Duration'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flightLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono whitespace-nowrap">
                      {log.flightDate ? new Date(log.flightDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-cyan-400">{getCallsign(log.uavId)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        log.missionType === 'DELIVERY' ? 'bg-cyan-500/10 text-cyan-400' :
                        log.missionType === 'MAPPING' ? 'bg-violet-500/10 text-violet-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {log.missionType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {WEATHER_ICONS[log.weatherCondition] || '—'} {log.weatherCondition || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">{log.distanceCoveredKm?.toFixed(1) ?? '—'} km</td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">{log.flightDurationMins ?? '—'} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddFlightModal isOpen={modalOpen} onClose={() => setModalOpen(false)} uavs={uavs} onAdd={(log) => setFlightLogs((p) => [log, ...p])} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Component
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'inventory',    label: 'Inventory & Config',  icon: Plane,     color: 'text-cyan-400' },
  { id: 'maintenance',  label: 'Maintenance & MRO',   icon: Wrench,    color: 'text-amber-400' },
  { id: 'logbook',      label: 'Flight Logbook',       icon: BookOpen,  color: 'text-violet-400' },
];

export default function FleetConfig() {
  const [activeTab, setActiveTab] = useState('inventory');

  // Separated state arrays per Phase 3 spec
  const [uavs, setUavs] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [flightLogs, setFlightLogs] = useState([]);

  // Load Demo Data — injects 1 related record per state (shared uavId)
  const loadDemoData = () => {
    setUavs((p) => p.some((u) => u.id === DEMO_UUID) ? p : [DEMO_UAV, ...p]);
    setMaintenanceLogs((p) => p.some((l) => l.id === DEMO_MAINTENANCE.id) ? p : [DEMO_MAINTENANCE, ...p]);
    setFlightLogs((p) => p.some((f) => f.id === DEMO_FLIGHT.id) ? p : [DEMO_FLIGHT, ...p]);
  };

  const activeTabCfg = TABS.find((t) => t.id === activeTab);

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden" style={{background:'#060d1a'}}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Plane className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Fleet Management</h1>
            <p className="text-xs text-slate-500">Inventory · MRO · Flight Records</p>
          </div>
        </div>

        {/* Load Demo Data */}
        <button onClick={loadDemoData}
          className="btn-ghost text-xs">
          <FlaskConical className="w-3.5 h-3.5" /> Load Demo Data
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-5 bg-slate-800/50 rounded-xl p-1 shrink-0 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? `bg-slate-700 ${tab.color} shadow-sm`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'inventory' && (
          <InventoryTab uavs={uavs} setUavs={setUavs} />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceTab uavs={uavs} maintenanceLogs={maintenanceLogs} setMaintenanceLogs={setMaintenanceLogs} />
        )}
        {activeTab === 'logbook' && (
          <LogbookTab uavs={uavs} flightLogs={flightLogs} setFlightLogs={setFlightLogs} />
        )}
      </div>
    </div>
  );
}
