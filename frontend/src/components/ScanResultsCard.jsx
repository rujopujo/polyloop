import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, AlertOctagon, HelpCircle, 
  Layers, PlusCircle, Info, Gauge, Activity,
  Atom, CheckCircle2, AlertTriangle, ArrowRight,
  Flame, Sparkles, ChevronRight
} from 'lucide-react';
import { getTierColor } from '../utils/formatting';
import { sound } from '../utils/sound';

function CircularGauge({ value, max = 100, label, suffix = "%", color = "#0df2a4", size = 96 }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
          <span className="text-base font-black text-white leading-none">
            {typeof value === 'number' ? (max === 1 ? value.toFixed(2) : Math.round(value)) : value}
            <span className="text-[10px] text-slate-400 font-normal">{suffix}</span>
          </span>
        </div>
      </div>
      <span className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

export default function ScanResultsCard({ result, onAddToBatch, onOpenDiagnostic }) {
  const [activeSubTab, setActiveSubTab] = useState('summary');

  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[420px]"
      >
        <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-3xl bg-emerald-400/5 blur-xl" />
          <Layers className="w-8 h-8 text-slate-400 relative z-10" />
        </div>
        <div>
          <h3 className="font-display font-bold text-white text-base">AWAITING CLASSIFICATION</h3>
          <p className="text-xs text-slate-400 font-mono mt-2 max-w-xs mx-auto leading-relaxed">
            Run the optical scanner or load a benchmark specimen to view real-time polymer identification, RoHS clearance, and thermal specs.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-slate-500">
          STATUS: INFERENCE IDLE
        </div>
      </motion.div>
    );
  }

  const isApproved = result.status === 'APPROVED';
  const tierStyle = getTierColor(result.hazard_tier);
  const confidencePct = Math.round((result.confidence || 0.85) * 100);
  const bfrScore = Number(result.bfr_risk_score || 0);

  const handlePushBatch = () => {
    sound.playSuccess();
    onAddToBatch(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-elevated rounded-3xl p-6 space-y-6 relative overflow-hidden"
    >
      {/* Top Identity & Status Header */}
      <div className="flex items-start justify-between border-b border-white/[0.08] pb-5">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
            IDENTIFIED RESIN MATRIX
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
              {result.polymer_detected || "UNKNOWN"}
            </h2>
            {result.iso_stamp_text && (
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                {result.iso_stamp_text}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Casing: <span className="text-slate-200">{result.casing_label || result.casing_type || "Electronic Housing"}</span>
          </p>
        </div>

        {/* Holographic Approval Badge */}
        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 ${tierStyle.badge} shadow-lg`}>
          {isApproved ? (
            <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-red-400/20 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-red-400" />
            </div>
          )}
          <div>
            <span className="text-xs font-mono font-black block tracking-wider uppercase">
              {isApproved ? "ROHS CLEARED" : "QUARANTINED"}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              TIER: {result.hazard_tier || 'MINIMAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Radial Gauges Display */}
      <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#050810] border border-white/[0.06]">
        <CircularGauge 
          value={confidencePct} 
          label="OCR CERTAINTY" 
          color="#0df2a4" 
        />
        <CircularGauge 
          value={bfrScore} 
          max={1} 
          suffix="" 
          label="BFR HAZARD SCORE" 
          color={bfrScore > 0.4 ? "#ef4444" : (bfrScore > 0.15 ? "#f59e0b" : "#00f0ff")} 
        />
      </div>

      {/* Flory-Huggins Polymer Miscibility Insight */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Atom className="w-4 h-4 text-cyan-400" />
            POLYMER COMPATIBILITY (FLORY-HUGGINS)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
            CHI &gt; 0 IMMISCIBLE
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {result.polymer_detected === 'ABS' && (
            <span>Polar SAN matrix is <strong>chemically incompatible with HIPS</strong>. Even 3% cross-contamination causes severe brittle micro-fractures in recycled 3D filament.</span>
          )}
          {result.polymer_detected === 'HIPS' && (
            <span>Non-polar polystyrene backbone. Keep segregated from ABS and PC to prevent delamination during nozzle extrusion.</span>
          )}
          {result.polymer_detected === 'PC-ABS' && (
            <span>Engineered alloy. Excellent thermal resistance, but demands pre-drying at 100°C for 3–4 hours before melt processing.</span>
          )}
          {!['ABS', 'HIPS', 'PC-ABS'].includes(result.polymer_detected) && (
            <span>Segregate pure resin stream. Verify halogen content before thermal compounding.</span>
          )}
        </p>
      </div>

      {/* Regulatory Recommendation Protocol */}
      <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${tierStyle.bg} ${tierStyle.border}`}>
        <div className="flex items-center gap-2 font-mono font-bold text-slate-200">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>FACTORY DISPOSITION PROTOCOL</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans">
          {result.recommended_action || "Clean high-purity polymer feed. Route to granulation and filament extrusion."}
        </p>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {result.polymer_detected === 'UNKNOWN' || !result.iso_stamp_found ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenDiagnostic}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-bold border border-amber-500/30 transition-all shadow-lg shadow-amber-950/30"
          >
            <HelpCircle className="w-4 h-4" />
            STAMP AMBIGUOUS? LAUNCH SINK-FLOAT LAB WIZARD
          </motion.button>
        ) : (
          <>
            <motion.button
              whileHover={isApproved ? { scale: 1.03 } : {}}
              whileTap={isApproved ? { scale: 0.97 } : {}}
              onClick={handlePushBatch}
              disabled={!isApproved}
              className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                isApproved
                  ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(13,242,164,0.35)] cursor-pointer'
                  : 'bg-white/[0.03] text-slate-600 border border-white/[0.05] cursor-not-allowed'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isApproved ? 'PUSH TO PRODUCTION BATCH' : 'BFR HAZARD QUARANTINE'}</span>
            </motion.button>

            <button
              onClick={onOpenDiagnostic}
              className="px-4 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-mono text-xs border border-white/[0.08] transition-colors"
            >
              PHYSICAL LAB TEST
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
