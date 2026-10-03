import React, { useState } from 'react';
import { 
  FlaskConical, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  PlusCircle, 
  Sparkles 
} from 'lucide-react';
import { api } from '../services/api';
import { getTierColor } from '../utils/formatting';

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

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const evaluateAnswers = async (finalAnswers) => {
    setIsEvaluating(true);
    try {
      const res = await api.runDiagnosticWizard(finalAnswers || answers);
      setDiagnosticResult(res);
      if (onDiagnosticComplete) {
        onDiagnosticComplete(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetWizard = () => {
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
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Interactive Sink-Float & Solvent Diagnostic Wizard
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic benchtop screening for degraded, painted, or un-stamped plastics
            </p>
          </div>
        </div>
        <button
          onClick={resetWizard}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono transition border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Result Display if evaluation complete */}
      {diagnosticResult ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Diagnostic Determination
                </span>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
                  {diagnosticResult.polymer_detected}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${
                diagnosticResult.status === 'APPROVED' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
              }`}>
                {diagnosticResult.status === 'APPROVED' ? 'Cleared For Extrusion' : 'Rejected (Toxic / Commingled)'}
              </div>
            </div>

            {/* Reasoning Trail */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block">Deduction Logic Trail:</span>
              <ul className="space-y-1.5">
                {diagnosticResult.reasoning?.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2 text-slate-400">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-slate-200 block mb-0.5">Recommended Action:</span>
              {diagnosticResult.recommended_action}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={resetWizard}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
            >
              Test Another Specimen
            </button>
          </div>
        </div>
      ) : (
        /* Questionnaire Steps */
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all ${
                    step === s
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/30'
                      : step > s
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {s}
                </div>
                {s < 5 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Pure Tap Water Test */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">Step 1: Water Bath Stratification (ρ = 1.00 g/cm³)</span>
                <h3 className="text-sm font-bold text-slate-200">
                  Submerge clean 5 mm plastic chip into plain tap water. Does it float or sink?
                </h3>
                <p className="text-xs text-slate-400">
                  Neat polyolefins (PP / HDPE) have specific gravities between 0.90–0.96 g/cm³ and float. Styrenics (ABS, HIPS) and Polycarbonate sink.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    handleAnswer('water_test', 'floats');
                    evaluateAnswers({ ...answers, water_test: 'floats' });
                  }}
                  className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 block mb-1">
                    Floats to the surface
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Confirms Polyolefin (PP / HDPE). Not compatible with styrenic filament recycling.
                  </span>
                </button>

                <button
                  onClick={() => {
                    handleAnswer('water_test', 'sinks');
                    setStep(2);
                  }}
                  className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 block mb-1">
                    Sinks to the bottom
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Density &gt; 1.00 g/cm³. Specimen is an engineering styrenic (ABS, HIPS) or PC.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: 10% NaCl Saline Solution */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">Step 2: Saline Density Stratification (ρ = 1.07 g/cm³)</span>
                <h3 className="text-sm font-bold text-slate-200">
                  Place the sinking chip into a 10% NaCl salt solution (100g salt / 1L water).
                </h3>
                <p className="text-xs text-slate-400">
                  Unfilled HIPS (1.03–1.05 g/cm³) floats cleanly in 10% NaCl. Virgin ABS (1.05–1.08) and PC (&gt;1.20) sink.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    handleAnswer('nacl_test', 'floats');
                    setStep(3); // proceed to limonene or acetone
                  }}
                  className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 block mb-1">
                    Floats cleanly
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Candidate for High-Impact Polystyrene (HIPS).
                  </span>
                </button>

                <button
                  onClick={() => {
                    handleAnswer('nacl_test', 'sinks');
                    setStep(3);
                  }}
                  className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 block mb-1">
                    Sinks to the bottom
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Density &gt; 1.07 g/cm³. Specimen is ABS, PC-ABS blend, or PC.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Acetone Spot Reaction */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">Step 3: Acetone Solvent Spot Test (30 Seconds)</span>
                <h3 className="text-sm font-bold text-slate-200">
                  Apply a single droplet of pure acetone onto the unpainted plastic surface for 30s.
                </h3>
                <p className="text-xs text-slate-400">
                  Observe surface solvation behavior. Polar nitrile groups in ABS dissolve rapidly into sticky paste.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {[
                  { id: 'tacky_paste', label: 'Sticky, Tacky Paste', desc: 'Instant nitrile dissolution (ABS)', poly: 'ABS' },
                  { id: 'slow_swell', label: 'Slow Surface Swell', desc: 'Softens without paste (HIPS)', poly: 'HIPS' },
                  { id: 'minor_haze', label: 'Minor Localized Haze', desc: 'Resistant surface (PC-ABS)', poly: 'PC-ABS' },
                  { id: 'resistant', label: 'Totally Resistant', desc: 'No softening or damage (Pure PC)', poly: 'PC' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      handleAnswer('acetone_reaction', opt.id);
                      setStep(4);
                    }}
                    className="p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition group"
                  >
                    <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 block mb-1">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Dense Brine & Limonene Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">Step 4: Chemical / Density Confirmation</span>
                <h3 className="text-sm font-bold text-slate-200">
                  Optional: d-Limonene solubility or dense brine (ρ = 1.15 g/cm³)
                </h3>
                <p className="text-xs text-slate-400">
                  d-Limonene terpene dissolves HIPS into clear gel within 2 minutes while ABS is completely inert.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => {
                    handleAnswer('limonene_reaction', 'dissolves_gel');
                    setStep(5);
                  }}
                  className="p-3.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200 block mb-1">Dissolves into Clear Gel</span>
                  <span className="text-[10px] text-slate-400">Confirms HIPS</span>
                </button>
                <button
                  onClick={() => {
                    handleAnswer('limonene_reaction', 'inert');
                    handleAnswer('brine_test', 'floats');
                    setStep(5);
                  }}
                  className="p-3.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200 block mb-1">Inert & Floats in Brine</span>
                  <span className="text-[10px] text-slate-400">Confirms ABS</span>
                </button>
                <button
                  onClick={() => {
                    handleAnswer('limonene_reaction', 'inert');
                    handleAnswer('brine_test', 'sinks');
                    setStep(5);
                  }}
                  className="p-3.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition"
                >
                  <span className="text-xs font-bold text-slate-200 block mb-1">Inert & Sinks in Brine</span>
                  <span className="text-[10px] text-slate-400">Confirms PC / BFR Plastic</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Beilstein Flame Test */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-rose-400 font-semibold uppercase">Step 5: Beilstein Copper Wire Flame Test (Hazard Check)</span>
                <h3 className="text-sm font-bold text-slate-200">
                  Heat a clean copper wire in a butane torch, press onto plastic, and reintroduce into flame.
                </h3>
                <p className="text-xs text-slate-400">
                  A bright emerald green flame reveals volatile copper halide formation (toxic bromine or chlorine).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    const finalAns = { ...answers, beilstein_flame: 'none' };
                    handleAnswer('beilstein_flame', 'none');
                    evaluateAnswers(finalAns);
                  }}
                  className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition"
                >
                  <span className="text-xs font-bold text-emerald-400 block mb-1">
                    Normal Yellow/Orange Flame (No Green)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Halogen-free. Compliant with RoHS & POPs directives.
                  </span>
                </button>

                <button
                  onClick={() => {
                    const finalAns = { ...answers, beilstein_flame: 'green' };
                    handleAnswer('beilstein_flame', 'green');
                    evaluateAnswers(finalAns);
                  }}
                  className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/40 text-left transition"
                >
                  <span className="text-xs font-bold text-rose-400 block mb-1">
                    Bright Emerald Green Flame Observed
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    High BFR / Halogen concentration. Mandatory RoHS rejection.
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
