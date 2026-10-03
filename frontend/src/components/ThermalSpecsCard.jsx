import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Thermometer, 
  Droplet, 
  Wind, 
  AlertTriangle, 
  Box, 
  Zap, 
  Info,
  Maximize2
} from 'lucide-react';
import { api, FALLBACK_POLYMERS } from '../services/api';

export default function ThermalSpecsCard({ activePolymer = 'ABS' }) {
  const [polymersData, setPolymersData] = useState(FALLBACK_POLYMERS);
  const [selectedKey, setSelectedKey] = useState(activePolymer);

  useEffect(() => {
    if (activePolymer && (activePolymer in polymersData)) {
      setSelectedKey(activePolymer);
    }
  }, [activePolymer, polymersData]);

  useEffect(() => {
    async function loadKB() {
      const data = await api.getPolymers();
      setPolymersData(data);
    }
    loadKB();
  }, []);

  const current = polymersData[selectedKey] || polymersData.ABS;
  const specs = current?.thermal_specs || {};

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
      {/* Header and Polymer Family Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Thermal Rheology & 3D Extrusion Calculator
            </h2>
            <p className="text-xs text-slate-400">
              Precise 3-zone melt extrusion boundaries and FDM printing parameters
            </p>
          </div>
        </div>

        {/* Polymer Selector Buttons */}
        <div className="flex space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {Object.keys(polymersData).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition ${
                selectedKey === key
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Single-Screw Extruder Diagram (Zones 1, 2, 3) */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>SINGLE-SCREW FILAMENT EXTRUDER BARREL (3:1 L/D RATIO)</span>
          </span>
          <span className="text-emerald-400">Nominal 1.75 mm ± 0.05 mm Target</span>
        </div>

        {/* Extruder Schematic Graphic */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          {/* Hopper / Feed Zone 1 */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Zone 1: Feed Throat</div>
            <div className="text-base font-extrabold text-amber-400 font-mono">
              {specs.extruder_feed_zone1_c || "185°C – 195°C"}
            </div>
            <div className="text-[10px] text-slate-400">Pellet conveyance without premature bridging</div>
            <div className="h-1 bg-amber-500/30 rounded-full w-full" />
          </div>

          {/* Zone 2: Compression / Transition */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Zone 2: Transition</div>
            <div className="text-base font-extrabold text-orange-400 font-mono">
              {specs.extruder_transition_zone2_c || "215°C – 225°C"}
            </div>
            <div className="text-[10px] text-slate-400">Melt homogenization & air removal</div>
            <div className="h-1 bg-orange-500/40 rounded-full w-full" />
          </div>

          {/* Zone 3: Metering / Die */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Zone 3: Die Melt Orifice</div>
            <div className="text-base font-extrabold text-rose-400 font-mono">
              {specs.extruder_die_zone3_c || "225°C – 235°C"}
            </div>
            <div className="text-[10px] text-slate-400">1.68 mm orifice with calibrated swell</div>
            <div className="h-1 bg-rose-500/50 rounded-full w-full" />
          </div>

          {/* Water Bath Quench */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-cyan-500/30 space-y-2 relative overflow-hidden">
            <div className="text-[10px] font-mono text-cyan-400 uppercase">Water Bath Quench</div>
            <div className="text-base font-extrabold text-cyan-300 font-mono">
              {specs.cooling_water_bath_c || "50°C – 60°C"}
            </div>
            <div className="text-[10px] text-slate-400">Controlled crystallization & ovality freeze</div>
            <div className="h-1 bg-cyan-400/50 rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* Grid of Pre-Drying and FDM Slicing Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Pre-Drying Protocol */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2">
            <span className="flex items-center space-x-1.5">
              <Droplet className="w-4 h-4 text-cyan-400" />
              <span>Hygroscopic Pre-Drying Protocol</span>
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Limit: &lt; {specs.max_moisture_ppm} ppm
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Target Chamber Temp</span>
              <span className="text-lg font-mono font-bold text-slate-100">{specs.pre_drying_temp_c}°C</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Residence Time</span>
              <span className="text-lg font-mono font-bold text-slate-100">{specs.pre_drying_hours}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
            <div className="flex items-center space-x-1 font-semibold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Failure Mode If Undried:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              {specs.extrusion_failure_mode_if_undried}
            </p>
          </div>
        </div>

        {/* FDM 3D Printing Operational Specs */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-200 font-bold border-b border-slate-800 pb-2">
            <span className="flex items-center space-x-1.5">
              <Box className="w-4 h-4 text-emerald-400" />
              <span>FDM 3D Printing Slicer Settings</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Shrinkage: {specs.volumetric_shrinkage}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Extruder Nozzle Temp</span>
              <span className="text-sm font-mono font-bold text-slate-100">{specs.fdm_nozzle_temp_c}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Heated Bed Temp</span>
              <span className="text-sm font-mono font-bold text-slate-100">{specs.fdm_bed_temp_c}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Build Surface:</span>
              <span className="text-slate-200 font-medium">{specs.build_plate_interface}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Chamber Enclosure:</span>
              <span className="text-slate-200 font-medium">{specs.chamber_temp_c}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Part Cooling Fan:</span>
              <span className="text-slate-200 font-medium">{specs.part_cooling_fan}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
