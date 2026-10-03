import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Thermometer, Droplet, AlertTriangle, 
  Box, Zap, Wind, Download, Copy, Check,
  Sliders, Gauge, Printer, Sparkles
} from 'lucide-react';
import { api, FALLBACK_POLYMERS } from '../services/api';
import { sound } from '../utils/sound';

export default function ThermalSpecsCard({ activePolymer = 'ABS' }) {
  const [polymersData, setPolymersData] = useState(FALLBACK_POLYMERS);
  const [selectedKey, setSelectedKey] = useState(activePolymer);
  const [extrusionSpeed, setExtrusionSpeed] = useState(45); // mm/s
  const [activeSlicer, setActiveSlicer] = useState('bambu');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activePolymer && (activePolymer in polymersData)) {
      setSelectedKey(activePolymer);
    }
  }, [activePolymer, polymersData]);

  useEffect(() => {
    api.getPolymers().then(setPolymersData);
  }, []);

  const current = polymersData[selectedKey] || polymersData.ABS;
  const specs = current?.thermal_specs || {};

  const handleSelectPolymer = (key) => {
    sound.playBlip(600, 0.04);
    setSelectedKey(key);
  };

  const getSlicerCode = () => {
    return `; === POLYLOOP RECYCLED ${selectedKey} PROFILE [${activeSlicer.toUpperCase()}] ===
; Extruder Temp: ${specs.fdm_nozzle_temp_c || '235°C'}
; Heated Bed Temp: ${specs.fdm_bed_temp_c || '100°C'}
; Chamber Target: ${specs.chamber_temp_c || '45°C'}
; Part Cooling Fan: ${specs.part_cooling_fan || '10%'}
; Volumetric Shrinkage: ${specs.volumetric_shrinkage || '0.5%'}
; Pre-Drying Req: ${specs.pre_drying_temp_c || '80'}°C for ${specs.pre_drying_hours || '3h'} (<${specs.max_moisture_ppm || '500'}ppm)
M104 S${specs.fdm_nozzle_temp_c ? parseInt(specs.fdm_nozzle_temp_c) : 235} ; Set hotend
M140 S${specs.fdm_bed_temp_c ? parseInt(specs.fdm_bed_temp_c) : 100} ; Set bed
M109 S${specs.fdm_nozzle_temp_c ? parseInt(specs.fdm_nozzle_temp_c) : 235} ; Wait hotend
M190 S${specs.fdm_bed_temp_c ? parseInt(specs.fdm_bed_temp_c) : 100} ; Wait bed
G28 ; Home all axes
G1 Z0.2 F1200 ; Prime start
G1 X60.0 E9.0 F1000.0 ; Extrude calibration line
G92 E0 ; Reset extruder`;
  };

  const copySlicerConfig = () => {
    sound.playSuccess();
    navigator.clipboard.writeText(getSlicerCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSlicerConfig = () => {
    sound.playClick();
    const blob = new Blob([getSlicerCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polyloop_${selectedKey.toLowerCase()}_${activeSlicer}.ini`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-elevated rounded-3xl p-6 sm:p-8 space-y-8 relative overflow-hidden"
    >
      {/* Top Header & Polymer Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white tracking-tight">
              THERMAL RHEOLOGY & MELT EXTRUSION ENGINE
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              3-Zone Barrel Dynamics • FDM Printing Bounds • Slicer Presets
            </p>
          </div>
        </div>

        {/* Polymer Selector Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#04060c] border border-white/[0.08]">
          {Object.keys(polymersData).map((key) => {
            const isSelected = selectedKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSelectPolymer(key)}
                className={`relative px-4 py-2 rounded-xl text-xs font-mono font-black transition-all ${
                  isSelected 
                    ? 'text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="polymerPill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{key}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Extruder Hotend Visualizer & Extrusion Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Animated Hotend & Nozzle Graphic */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#040710] border border-white/[0.08] relative overflow-hidden flex flex-col justify-between min-h-[380px]">
          
          <div className="flex items-center justify-between z-10">
            <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              HOTEND CROSS-SECTION & FLOW SIMULATOR
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">
              {current.iso_marking} • {current.density_range}
            </span>
          </div>

          {/* Interactive Extruder Geometry */}
          <div className="relative py-8 flex flex-col items-center justify-center">
            
            {/* Feed Throat Zone 1 */}
            <div className="w-36 p-3 rounded-t-xl bg-slate-800/90 border border-slate-700 text-center relative z-20">
              <span className="text-[9px] font-mono text-slate-400 block">ZONE 1: FEED</span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {specs.extruder_feed_zone1_c || '185°C – 195°C'}
              </span>
            </div>

            {/* Transition Barrel Zone 2 */}
            <div className="w-32 p-3 bg-gradient-to-b from-slate-800 to-amber-950/80 border-x border-amber-500/40 text-center relative z-20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <span className="text-[9px] font-mono text-slate-400 block">ZONE 2: COMPRESSION</span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {specs.extruder_transition_zone2_c || '215°C – 225°C'}
              </span>
            </div>

            {/* Melt Die Zone 3 */}
            <div className="w-24 p-3 bg-gradient-to-b from-amber-900 to-orange-600 border-x border-b border-orange-400 text-center relative z-20 shadow-[0_0_25px_rgba(249,115,22,0.3)]">
              <span className="text-[9px] font-mono text-slate-900 font-black block">ZONE 3: DIE</span>
              <span className="text-xs font-mono font-black text-white">
                {specs.extruder_die_zone3_c || '225°C – 235°C'}
              </span>
            </div>

            {/* Brass Nozzle Tip */}
            <div 
              className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[24px] border-t-amber-500 relative z-20 shadow-[0_0_15px_#f59e0b]"
            />

            {/* Molten Filament Stream flowing onto bed */}
            <div className="w-1.5 h-16 bg-gradient-to-b from-orange-400 via-amber-300 to-emerald-400 relative overflow-hidden">
              <motion.div
                className="w-full h-4 bg-white/70"
                animate={{ y: ['-100%', '300%'] }}
                transition={{ duration: 120 / (extrusionSpeed || 40), repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Heated Print Bed */}
            <div className="w-64 h-6 rounded-lg bg-slate-900 border-t-2 border-emerald-400 text-center flex items-center justify-center shadow-[0_0_20px_rgba(13,242,164,0.2)]">
              <span className="text-[10px] font-mono text-emerald-300 font-bold">
                HEATED BED: {specs.fdm_bed_temp_c || '100°C'} • {specs.build_plate_interface || 'PEI'}
              </span>
            </div>
          </div>

          {/* Extrusion Speed Slider Controller */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4 z-10">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              FLOW VELOCITY:
            </span>
            <input
              type="range"
              min="10"
              max="120"
              value={extrusionSpeed}
              onChange={(e) => setExtrusionSpeed(Number(e.target.value))}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-amber-400 min-w-[50px] text-right">
              {extrusionSpeed} mm/s
            </span>
          </div>
        </div>

        {/* Right Parameters: Pre-Drying & Critical Metrics */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Pre-Drying Protocol Card */}
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-300 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-amber-400" />
                MANDATORY PRE-DRYING PROTOCOL
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                MAX &lt;{specs.max_moisture_ppm || 500} PPM
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20">
                <span className="text-[10px] text-slate-400 block">DESICCANT OVEN TEMP</span>
                <span className="text-base font-bold text-amber-300">
                  {specs.pre_drying_temp_c || 80}°C
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20">
                <span className="text-[10px] text-slate-400 block">DURATION</span>
                <span className="text-base font-bold text-amber-300">
                  {specs.pre_drying_hours || '3 to 4 hours'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong>Undried Failure Risk:</strong> {specs.extrusion_failure_mode_if_undried || 'Catastrophic steam bubbling and layer delamination.'}
              </span>
            </div>
          </div>

          {/* Quick Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">FDM NOZZLE TEMP</span>
              <span className="text-sm font-bold text-white">{specs.fdm_nozzle_temp_c || '230°C – 245°C'}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">PART COOLING FAN</span>
              <span className="text-sm font-bold text-white">{specs.part_cooling_fan || '0% – 15%'}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">ENCLOSURE TEMP</span>
              <span className="text-sm font-bold text-white">{specs.chamber_temp_c || 'Passive 45°C'}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block">VOLUMETRIC SHRINKAGE</span>
              <span className="text-sm font-bold text-white">{specs.volumetric_shrinkage || '0.4% – 0.7%'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slicer Profile Exporter Section */}
      <div className="p-6 rounded-3xl bg-[#04060c] border border-white/[0.08] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="font-display font-bold text-white text-sm">
                1-CLICK SLICER CONFIGURATION GENERATOR
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Production-grade presets tuned for 100% recycled {selectedKey} filament
              </p>
            </div>
          </div>

          {/* Slicer Brand Selector */}
          <div className="flex items-center gap-2">
            {[
              { id: 'bambu', label: 'Bambu Studio' },
              { id: 'prusa', label: 'PrusaSlicer' },
              { id: 'cura', label: 'UltiMaker Cura' }
            ].map((slicer) => (
              <button
                key={slicer.id}
                onClick={() => { sound.playClick(); setActiveSlicer(slicer.id); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  activeSlicer === slicer.id 
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(13,242,164,0.3)]' 
                    : 'bg-white/[0.03] text-slate-400 hover:text-slate-200'
                }`}
              >
                {slicer.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Viewport with Copy & Download */}
        <div className="relative rounded-2xl bg-black/60 border border-white/[0.06] p-4 font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-48">
          <pre>{getSlicerCode()}</pre>
          
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={copySlicerConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.15] text-white text-[11px] font-mono transition-colors shadow-md backdrop-blur-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED!' : 'COPY INI'}</span>
            </button>
            <button
              onClick={downloadSlicerConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] font-mono transition-colors shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
