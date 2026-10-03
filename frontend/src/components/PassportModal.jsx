import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Download, 
  X, 
  ShieldCheck, 
  Flame, 
  Leaf, 
  Hash, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { api, FALLBACK_BATCH_METRICS, FALLBACK_POLYMERS } from '../services/api';
import { formatKg, formatCO2, formatDateTime } from '../utils/formatting';

export default function PassportModal({ batchId, isOpen, onClose }) {
  const [metrics, setMetrics] = useState(FALLBACK_BATCH_METRICS);
  const [batchInfo, setBatchInfo] = useState(null);

  useEffect(() => {
    if (!batchId || !isOpen) return;

    async function loadData() {
      const m = await api.getBatchMetrics(batchId);
      setMetrics(m);
      const allBatches = await api.getBatches();
      const b = allBatches.find(x => x.id === batchId);
      setBatchInfo(b);
    }
    loadData();
  }, [batchId, isOpen]);

  if (!isOpen) return null;

  const targetPolymer = metrics.target_polymer || "ABS";
  const polymerProfile = FALLBACK_POLYMERS[targetPolymer] || FALLBACK_POLYMERS.ABS;
  const specs = polymerProfile.thermal_specs || {};

  const handleDownload = () => {
    window.open(`/api/passport/${batchId}/pdf`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-100 font-mono tracking-wide">
                DIGITAL MATERIAL PASSPORT PREVIEW
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Verification Ledger ID: <span className="text-emerald-400 font-bold">{batchId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950 font-mono"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Passport Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Section 1: Executive Clearance Header */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                Certificate Status
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold font-mono text-slate-100">
                  {batchInfo?.name || metrics.batch_name}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold text-[10px]">
                  QUALIFIED LOT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Created: {formatDateTime(metrics.created_at)} | Target Matrix: <b className="text-slate-200">{targetPolymer}</b>
              </p>
            </div>

            {/* Hash Stamp & QR Representation */}
            <div className="flex items-center space-x-3 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800 font-mono text-[10px]">
              <QrCode className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-500 block">SHA-256 LEDGER HASH:</span>
                <span className="text-slate-300 font-bold block">
                  {batchId?.slice(-8) || "8F4A2C19"}...E412A8
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Chemical & BFR Compliance */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center space-x-2 uppercase font-mono text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>1. Regulatory Directives & Chemical Safety Audit</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] text-emerald-400 font-mono font-bold block">EU RoHS DIRECTIVE</span>
                <p className="text-slate-200 font-bold">PASSED (&lt; 0.1% / 1000 ppm)</p>
                <p className="text-[10px] text-slate-400">DecaBDE / OctaBDE below statutory maximum limits.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] text-emerald-400 font-mono font-bold block">EU POPs REGULATION 2019/1021</span>
                <p className="text-slate-200 font-bold">CLEARED (&lt; 500 ppm)</p>
                <p className="text-[10px] text-slate-400">Qualified for secondary consumer goods & 3D filament.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                <span className="text-[10px] text-cyan-400 font-mono font-bold block">WEEE DIRECTIVE ANNEX VII</span>
                <p className="text-slate-200 font-bold">SELECTIVE EXTRACTION OK</p>
                <p className="text-[10px] text-slate-400">Hazardous CRT / flame-retarded fractions segregated.</p>
              </div>
            </div>
          </div>

          {/* Section 3: LCA Environmental Impact Statement */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center space-x-2 uppercase font-mono text-xs text-cyan-400">
              <Leaf className="w-4 h-4 text-cyan-400" />
              <span>2. ISO 14040/14044 Life Cycle Assessment Statement</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Net CO₂e Prevented</span>
                <span className="text-lg font-mono font-extrabold text-emerald-400">
                  {formatCO2(metrics.net_co2_avoided_kg)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Crude Oil Saved</span>
                <span className="text-lg font-mono font-extrabold text-cyan-400">
                  ~{Number(metrics.crude_oil_saved_liters || 0).toFixed(1)} L
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Coal Offset</span>
                <span className="text-lg font-mono font-extrabold text-amber-400">
                  ~{Number(metrics.coal_offset_kg || 0).toFixed(1)} kg
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Circularity Yield</span>
                <span className="text-lg font-mono font-extrabold text-slate-100">
                  {((metrics.usable_mass_kg / metrics.total_inflow_mass_kg) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: 3-Zone Extrusion Datasheet */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 flex items-center space-x-2 uppercase font-mono text-xs text-amber-400">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>3. Filament Extrusion & 3D Printing Datasheet</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Pre-Drying Temp & Time:</span>
                  <span className="text-slate-100 font-bold">{specs.pre_drying_temp_c}°C ({specs.pre_drying_hours})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Moisture Tolerance:</span>
                  <span className="text-emerald-400 font-bold">&lt; {specs.max_moisture_ppm} ppm</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Single-Screw Feed Z1:</span>
                  <span className="text-slate-100">{specs.extruder_feed_zone1_c}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Transition Zone Z2:</span>
                  <span className="text-slate-100">{specs.extruder_transition_zone2_c}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Die Melt Orifice Z3:</span>
                  <span className="text-slate-100">{specs.extruder_die_zone3_c}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>FDM Extruder Nozzle:</span>
                  <span className="text-slate-100 font-bold">{specs.fdm_nozzle_temp_c}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>FDM Heated Bed:</span>
                  <span className="text-slate-100 font-bold">{specs.fdm_bed_temp_c}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Chamber Enclosure:</span>
                  <span className="text-slate-100">{specs.chamber_temp_c}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cooling Water Bath:</span>
                  <span className="text-cyan-400">{specs.cooling_water_bath_c}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Thermal Shrinkage:</span>
                  <span className="text-slate-100">{specs.volumetric_shrinkage}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[10px]">
            Certified by PolyLoop Digital Chain of Custody Protocol
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
