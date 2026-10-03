import React from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Layers, 
  PlusCircle, 
  Info 
} from 'lucide-react';
import { getTierColor } from '../utils/formatting';

export default function ScanResultsCard({ 
  result, 
  onAddToBatch, 
  onOpenDiagnostic 
}) {
  if (!result) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No Sample Analyzed Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Capture an e-waste casing image or select a pre-bundled test stamp above to trigger real-time AI classification and BFR hazard screening.
        </p>
      </div>
    );
  }

  const isApproved = result.status === 'APPROVED';
  const tierStyle = getTierColor(result.hazard_tier);
  const confidencePct = Math.round((result.confidence || 0.85) * 100);
  const bfrScore = Number(result.bfr_risk_score || 0).toFixed(2);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
      {/* Top Banner & Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Verification Output
          </span>
          <div className="flex items-center space-x-2 mt-0.5">
            <h2 className="text-xl font-extrabold text-slate-100 font-mono">
              {result.polymer_detected || "UNKNOWN"}
            </h2>
            {result.iso_stamp_text && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {result.iso_stamp_text}
              </span>
            )}
          </div>
        </div>

        {/* Regulatory Badge */}
        <div className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 ${tierStyle.badge}`}>
          {isApproved ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertOctagon className="w-4 h-4 text-red-400" />
          )}
          <div className="text-right">
            <span className="text-[11px] font-bold block uppercase tracking-wide">
              {isApproved ? "RoHS / POPs Cleared" : "Regulatory Rejection"}
            </span>
            <span className="text-[9px] font-mono block opacity-80">
              Tier: {result.hazard_tier}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Confidence Meter */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span>OCR Confidence</span>
            <span className="font-mono text-emerald-400 font-bold">{confidencePct}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>

        {/* BFR Risk Score */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span>BFR Risk Index</span>
            <span className={`font-mono font-bold ${Number(bfrScore) > 0.4 ? 'text-red-400' : 'text-cyan-400'}`}>
              {bfrScore} / 1.00
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                Number(bfrScore) > 0.4 ? 'bg-red-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, Number(bfrScore) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommended Handling Action */}
      <div className={`p-3.5 rounded-lg border text-xs space-y-1 ${tierStyle.bg} ${tierStyle.border}`}>
        <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Operational Protocol</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans">
          {result.recommended_action}
        </p>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {result.polymer_detected === 'UNKNOWN' || !result.iso_stamp_found ? (
          <button
            onClick={onOpenDiagnostic}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Stamp Missing or Worn? Launch Sink-Float Wizard</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => onAddToBatch(result)}
              disabled={!isApproved}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                isApproved
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isApproved ? 'Push to Recycling Batch' : 'Quarantine (BFR Contaminated)'}</span>
            </button>

            <button
              onClick={onOpenDiagnostic}
              className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              title="Verify with benchtop sink-float tests"
            >
              Diagnostic Fallback
            </button>
          </>
        )}
      </div>
    </div>
  );
}
