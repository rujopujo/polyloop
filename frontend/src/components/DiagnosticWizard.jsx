import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, ArrowRight, RotateCcw, CheckCircle, 
  AlertTriangle, Sparkles, Beaker, Flame, Droplets,
  HelpCircle, ShieldCheck, Waves, Pipette
} from 'lucide-react';
import { api } from '../services/api';
import { sound } from '../utils/sound';

export default function DiagnosticWizard({ onDiagnosticComplete }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    casing_type: 'unknown_housing',
    vintage_era: '2000-2015',
    water_test: '',
    nacl_test: '',
    brine_test: '',
    acetone_reaction: '',
    limonene_reaction: '',
    beilstein_flame: 'none'
  });
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [pelletLevel, setPelletLevel] = useState('top'); // top, mid-high, mid-low, bottom
  const [solventReacting, setSolventReacting] = useState(null);
  const [flameColor, setFlameColor] = useState('blue'); // blue, green, orange

  const handleDensitySelect = (testKey, val, visualLevel) => {
    sound.playBlip(650, 0.05);
    setAnswers(prev => ({ ...prev, [testKey]: val }));
    setPelletLevel(visualLevel);
  };

  const handleSolventSelect = (solventKey, val) => {
    sound.playClick();
    setAnswers(prev => ({ ...prev, [solventKey]: val }));
    setSolventReacting(val);
  };

  const handleFlameSelect = (flameType) => {
    sound.playClick();
    setAnswers(prev => ({ ...prev, beilstein_flame: flameType }));
    setFlameColor(flameType === 'bright_green' ? 'green' : 'orange');
  };

  const evaluateFinal = async () => {
    sound.playScan();
    setIsEvaluating(true);
    try {
      const res = await api.runDiagnosticWizard(answers);
      setDiagnosticResult(res);
      if (res.rohs_compliant) {
        sound.playSuccess();
      } else {
        sound.playWarning();
      }
      if (onDiagnosticComplete) onDiagnosticComplete(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetAll = () => {
    sound.playClick();
    setStep(1);
    setAnswers({
      casing_type: 'unknown_housing',
      vintage_era: '2000-2015',
      water_test: '',
      nacl_test: '',
      brine_test: '',
      acetone_reaction: '',
      limonene_reaction: '',
      beilstein_flame: 'none'
    });
    setDiagnosticResult(null);
    setPelletLevel('top');
    setSolventReacting(null);
    setFlameColor('blue');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-elevated rounded-3xl p-6 sm:p-8 space-y-8 relative overflow-hidden"
    >
      {/* Workbench Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <FlaskConical className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white tracking-tight flex items-center gap-2">
              VIRTUAL ANALYTICAL LAB BENCH
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Deterministic Physical & Chemical Screening for Un-Stamped E-Waste
            </p>
          </div>
        </div>

        <button
          onClick={resetAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          RESET WORKBENCH
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { num: 1, title: 'Casing Era', icon: Sparkles },
          { num: 2, title: 'Sink-Float Column', icon: Waves },
          { num: 3, title: 'Solvent Cell', icon: Pipette },
          { num: 4, title: 'Flame & Halogen', icon: Flame }
        ].map((s) => {
          const isCurrent = step === s.num;
          const isPassed = step > s.num;
          const Icon = s.icon;
          return (
            <button
              key={s.num}
              onClick={() => { sound.playBlip(500 + s.num * 50, 0.03); setStep(s.num); }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isCurrent 
                  ? 'bg-cyan-400/15 border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]' 
                  : isPassed 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-bold">STAGE 0{s.num}</span>
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-300' : isPassed ? 'text-emerald-400' : 'text-slate-600'}`} />
              </div>
              <span className={`text-xs font-bold block truncate ${isCurrent ? 'text-white' : isPassed ? 'text-slate-200' : 'text-slate-500'}`}>
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Simulation Stages */}
      <AnimatePresence mode="wait">
        
        {/* STEP 1: Casing Typology & Vintage */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-base font-display font-bold text-white">Select Casing Category & Era</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Vintage era determines baseline likelihood of polybrominated diphenyl ethers (PBDE / OctaBDE).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block">
                  Housing Morphology:
                </label>
                {[
                  { id: 'desktop_chassis', name: 'Desktop Tower / Monitor Chassis', desc: 'High frequency of ABS and PC-ABS' },
                  { id: 'keyboard_mouse_router', name: 'Peripherals & Routers (Keyboards/Mice)', desc: 'Preponderance of high-purity virgin ABS' },
                  { id: 'crt_housing', name: 'Vintage CRT Monitor / TV Enclosure', desc: 'Critical risk: >85% contain legacy BFR additives' },
                  { id: 'printer_scanner', name: 'Printer / Copier Internal Structure', desc: 'Frequently HIPS or talc-filled ABS alloys' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { sound.playClick(); setAnswers(a => ({ ...a, casing_type: item.id })); }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      answers.casing_type === item.id 
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg' 
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider block">
                  Vintage Manufacturing Era:
                </label>
                {[
                  { id: 'pre-2000', label: 'Pre-2000 (Legacy)', hazard: 'Extreme BFR Risk (OctaBDE / DecaBDE)', tag: 'CRITICAL HAZARD' },
                  { id: '2000-2015', label: '2000 – 2015 (RoHS Transition)', hazard: 'Moderate BFR Risk; requires solvent & sink test', tag: 'MODERATE' },
                  { id: 'post-2015', label: 'Post-2015 (Modern Eco-Design)', hazard: 'Low risk; RoHS / REACH compliant phosphorus FR', tag: 'MINIMAL' }
                ].map((era) => (
                  <button
                    key={era.id}
                    onClick={() => { sound.playClick(); setAnswers(a => ({ ...a, vintage_era: era.id })); }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      answers.vintage_era === era.id 
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg' 
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{era.label}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${era.id === 'pre-2000' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/[0.05] text-slate-400'}`}>
                        {era.tag}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{era.hazard}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => { sound.playBlip(600, 0.04); setStep(2); }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform"
              >
                PROCEED TO DENSITY COLUMN <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Sink-Float Density Column */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-display font-bold text-white">Stratified Density Column Test</h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Polymers possess strict specific gravities: Water (1.00), 10% Saline (1.07), Dense Brine (1.15).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Animated Interactive Density Graduated Cylinder */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-48 h-80 rounded-3xl bg-[#03060d] border-2 border-white/[0.12] relative overflow-hidden flex flex-col justify-end p-2 shadow-2xl">
                  
                  {/* Graduated markings */}
                  <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-6 text-[8px] font-mono text-slate-500 pointer-events-none z-20">
                    <span>100ml — 1.00 g/cm³</span>
                    <span>75ml — 1.05 g/cm³</span>
                    <span>50ml — 1.07 g/cm³</span>
                    <span>25ml — 1.15 g/cm³</span>
                    <span>00ml — 1.25 g/cm³</span>
                  </div>

                  {/* Liquid layers */}
                  <div className="absolute inset-x-0 top-0 h-1/3 bg-cyan-500/10 border-b border-cyan-400/20" />
                  <div className="absolute inset-x-0 top-1/3 h-1/3 bg-teal-500/15 border-b border-teal-400/20" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-600/20" />

                  {/* Animated Polymer Specimen Pellet */}
                  <motion.div
                    className="w-10 h-10 rounded-2xl bg-emerald-400 border-2 border-white text-slate-950 font-mono font-black text-[10px] flex items-center justify-center absolute left-1/2 -translate-x-1/2 shadow-[0_0_20px_#0df2a4] z-30"
                    animate={{
                      top: pelletLevel === 'top' ? '12%' : 
                           pelletLevel === 'mid-high' ? '40%' : 
                           pelletLevel === 'mid-low' ? '68%' : '85%',
                      rotate: [0, 8, -8, 0],
                      y: [0, -4, 0]
                    }}
                    transition={{
                      top: { type: 'spring', stiffness: 120, damping: 14 },
                      rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                      y: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  >
                    PELLET
                  </motion.div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-3 text-center">
                  VIRTUAL GRADUATED HYDRO-COLUMN
                </div>
              </div>

              {/* Density Options */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    TEST A: TAP WATER (ρ = 1.00 g/cm³)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDensitySelect('water_test', 'floats', 'top')}
                      className={`p-3 rounded-xl border text-left text-xs font-mono transition-all ${
                        answers.water_test === 'floats' 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                      }`}
                    >
                      Floats on Water (PP / PE)
                    </button>
                    <button
                      onClick={() => handleDensitySelect('water_test', 'sinks', 'mid-high')}
                      className={`p-3 rounded-xl border text-left text-xs font-mono transition-all ${
                        answers.water_test === 'sinks' 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                      }`}
                    >
                      Sinks in Water (ABS / PS / PC)
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    TEST B: 10% SALINE NaCl (ρ = 1.07 g/cm³)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDensitySelect('nacl_test', 'floats', 'mid-high')}
                      className={`p-3 rounded-xl border text-left text-xs font-mono transition-all ${
                        answers.nacl_test === 'floats' 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                      }`}
                    >
                      Floats in 10% Saline (HIPS)
                    </button>
                    <button
                      onClick={() => handleDensitySelect('nacl_test', 'sinks', 'mid-low')}
                      className={`p-3 rounded-xl border text-left text-xs font-mono transition-all ${
                        answers.nacl_test === 'sinks' 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                      }`}
                    >
                      Sinks in 10% Saline (ABS / PC)
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    TEST C: DENSE BRINE (ρ = 1.15 g/cm³)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDensitySelect('brine_test', 'floats', 'mid-low')}
                      className={`p-3 rounded-xl border text-left text-xs font-mono transition-all ${
                        answers.brine_test === 'floats' 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                      }`}
                    >
                      Floats in Brine (Virgin ABS)
                    </button>
                    <button
                      onClick={() => handleDensitySelect('brine_test', 'sinks', 'bottom')}
                      className={`p-3 rounded-xl border text-left text-xs font-mono transition-all ${
                        answers.brine_test === 'sinks' 
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                      }`}
                    >
                      Sinks in Brine (PC / Heavy BFR)
                    </button>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 font-mono text-xs hover:bg-white/[0.08]"
                  >
                    BACK
                  </button>
                  <button
                    onClick={() => { sound.playBlip(650, 0.04); setStep(3); }}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform"
                  >
                    SOLVENT DISSOLUTION CELL <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Chemical Solvent Reaction Chamber */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-base font-display font-bold text-white">Solvent Dissolution Cell</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Acetone and D-Limonene chemically separate ABS vs HIPS with 100% precision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Acetone Cell */}
              <div className="p-6 rounded-3xl bg-[#050812] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-400" />
                    ACETONE SPOT REACTION (20s)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Volatile Polar</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { id: 'tacky_paste', label: 'Tacky Sticky Paste (ABS)', desc: 'Rapidly dissolves into gum in 10-25 seconds' },
                    { id: 'softens_swells', label: 'Swelling & Softening (HIPS)', desc: 'Softens with white rubbery surface' },
                    { id: 'inert_no_reaction', label: 'Chemically Inert (PC / PP)', desc: 'Surface unaffected or minor optical haze' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSolventSelect('acetone_reaction', opt.id)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all ${
                        answers.acetone_reaction === opt.id 
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="font-bold text-slate-200">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* D-Limonene Cell */}
              <div className="p-6 rounded-3xl bg-[#050812] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    D-LIMONENE ESSENCE TEST (2 min)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Terpene Non-Polar</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { id: 'inert', label: 'Completely Inert (ABS)', desc: 'Zero dissolution; polymer remains rock-hard' },
                    { id: 'dissolves', label: 'Dissolves to Clear Gel (HIPS)', desc: 'Polystyrene backbone dissolves in 90 seconds' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSolventSelect('limonene_reaction', opt.id)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all ${
                        answers.limonene_reaction === opt.id 
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg' 
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="font-bold text-slate-200">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 font-mono text-xs hover:bg-white/[0.08]"
              >
                BACK
              </button>
              <button
                onClick={() => { sound.playBlip(700, 0.04); setStep(4); }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform"
              >
                BEILSTEIN FLAME TEST <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Beilstein Copper Wire Flame Chamber */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-base font-display font-bold text-white">Beilstein Copper Wire & Halogen Flame Chamber</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Heated copper wire reacts with halogenated flame retardants (Bromine / Chlorine) emitting a brilliant emerald flame.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Virtual Bunsen Burner Flame Simulation */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-48 h-64 rounded-3xl bg-[#02050c] border border-white/[0.1] relative flex flex-col items-center justify-end pb-4 overflow-hidden shadow-2xl">
                  {/* Bunsen Base */}
                  <div className="w-16 h-8 bg-slate-700 rounded-t-lg relative z-10 border border-slate-600" />
                  <div className="w-24 h-4 bg-slate-800 rounded-lg relative z-10" />

                  {/* Animated Flame */}
                  <motion.div
                    className="absolute bottom-12 w-16 h-28 rounded-full blur-sm"
                    style={{
                      background: flameColor === 'green' 
                        ? 'radial-gradient(ellipse at bottom, #0df2a4, #10b981, transparent 75%)' 
                        : (flameColor === 'orange' ? 'radial-gradient(ellipse at bottom, #f59e0b, #ef4444, transparent 75%)' : 'radial-gradient(ellipse at bottom, #00f0ff, #3b82f6, transparent 75%)'),
                      boxShadow: flameColor === 'green' ? '0 0 50px #0df2a4' : '0 0 40px #f59e0b'
                    }}
                    animate={{
                      scaleY: [1, 1.25, 0.95, 1.15, 1],
                      scaleX: [1, 0.9, 1.1, 0.95, 1],
                      x: [0, 2, -2, 1, 0]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute top-4 font-mono text-[9px] text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-white/[0.05]">
                    FLAME SPECTROMETRY
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-2">
                  BEILSTEIN SIMULATOR
                </div>
              </div>

              {/* Flame Selection Buttons */}
              <div className="lg:col-span-7 space-y-3.5">
                {[
                  { id: 'bright_green', label: 'Vivid Emerald Green Flame', risk: 'POSITIVE HALOGEN (BFR / PVC)', desc: 'Copper halide formed: specimen contains toxic brominated flame retardants. Mandatory quarantine.', color: 'border-red-500/40 text-red-300' },
                  { id: 'yellow_orange_sooty', label: 'Yellow/Orange Flame with Soot Webs', risk: 'NEGATIVE HALOGEN (Clean ABS/PS)', desc: 'Aromatic styrene burning cleanly with carbon soot filaments. RoHS compliant.', color: 'border-emerald-500/40 text-emerald-300' },
                  { id: 'none', label: 'Normal Clean Blue Flame', risk: 'NON-HALOGENATED', desc: 'No copper reaction detected. Proceed with baseline upcycling.', color: 'border-white/[0.08] text-slate-300' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleFlameSelect(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      answers.beilstein_flame === item.id 
                        ? 'bg-white/[0.08] border-cyan-400 text-white shadow-lg' 
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{item.label}</span>
                      <span className="text-[10px] font-mono font-bold">{item.risk}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                  </button>
                ))}

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-slate-300 font-mono text-xs hover:bg-white/[0.08]"
                  >
                    BACK
                  </button>
                  <button
                    onClick={evaluateFinal}
                    disabled={isEvaluating}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 text-slate-950 font-mono font-black text-xs uppercase shadow-[0_0_25px_rgba(13,242,164,0.4)] hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isEvaluating ? 'SYNTHESIZING VERDICT...' : 'SYNTHESIZE DIAGNOSTIC VERDICT'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Diagnostic Deduction Card */}
      <AnimatePresence>
        {diagnosticResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-[#06121f] to-[#040812] border-2 border-cyan-400/40 space-y-4 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  DIAGNOSTIC DEDUCTION OUTCOME
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="text-3xl font-display font-black text-white">
                    {diagnosticResult.polymer_detected}
                  </h3>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-bold">
                    CONFIDENCE: {Math.round((diagnosticResult.confidence || 0.92) * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
                {diagnosticResult.rohs_compliant ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
                <div className="font-mono text-xs font-bold text-white uppercase">
                  {diagnosticResult.rohs_compliant ? "ROHS APPROVED" : "BFR QUARANTINE REQUIRED"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                EXPERIMENTAL PROOF LOG:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                {diagnosticResult.reasoning?.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
              {diagnosticResult.recommended_action}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
