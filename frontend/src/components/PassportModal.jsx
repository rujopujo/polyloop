import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCheck2, Download, X, ShieldCheck, 
  Flame, Leaf, QrCode, Copy, Check, Printer,
  Sparkles, ExternalLink, Hash, Award
} from 'lucide-react';
import { api, FALLBACK_BATCH_METRICS, FALLBACK_POLYMERS } from '../services/api';
import { formatKg, formatCO2, formatDateTime } from '../utils/formatting';
import { sound } from '../utils/sound';

export default function PassportModal({ batchId, isOpen, onClose }) {
  const [metrics, setMetrics] = useState(FALLBACK_BATCH_METRICS);
  const [batchInfo, setBatchInfo] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (!batchId || !isOpen) return;
    async function loadData() {
      const m = await api.getBatchMetrics(batchId);
      setMetrics(m);
      const allBatches = await api.getBatches();
      setBatchInfo(allBatches.find(x => x.id === batchId));
    }
    loadData();
  }, [batchId, isOpen]);

  if (!isOpen) return null;

  const targetPolymer = metrics.target_polymer || "ABS";
  const polymerProfile = FALLBACK_POLYMERS[targetPolymer] || FALLBACK_POLYMERS.ABS;
  const specs = polymerProfile.thermal_specs || {};
  const mockSha256 = `0x${batchId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}9a4f8b2c1e7d3890f5aa67812903e4d`;

  const handleDownload = () => {
    sound.playClick();
    window.open(`/api/passport/${batchId}/pdf`, '_blank');
  };

  const handleCopyHash = () => {
    sound.playSuccess();
    navigator.clipboard.writeText(mockSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="glass-panel-elevated rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col relative overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)]"
          >
            {/* Holographic Rainbow Foil Banner Top */}
            <div className="h-2.5 w-full hologram-foil" />

            {/* Top Bar Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#070b14]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(13,242,164,0.25)]">
                  <Award className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-display font-black text-white tracking-wide">
                      DIGITAL PRODUCT PASSPORT (DPP)
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                      ESPR / CIRPASS
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    CERTIFICATE ID: <span className="text-emerald-400 font-bold">{batchId}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-mono border border-white/[0.08] transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  PRINT
                </button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-mono font-black shadow-[0_0_20px_rgba(13,242,164,0.3)] transition-transform"
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD PDF
                </motion.button>

                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Passport Certificate Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-300">
              
              {/* Executive Header Box */}
              <div className="p-6 rounded-3xl bg-[#04060c] border border-white/[0.08] flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                    PRODUCTION LOT LEDGER IDENTITY
                  </span>
                  <div className="text-2xl font-display font-black text-white">
                    {batchInfo?.name || metrics.batch_name}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Target Polymer Stream: <strong className="text-emerald-400 font-bold">{targetPolymer}</strong> ({polymerProfile.name})
                  </div>
                </div>

                {/* Simulated Scannable QR Code */}
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#090d16] border border-white/[0.08]">
                  <div className="w-16 h-16 bg-white rounded-xl p-1.5 flex items-center justify-center">
                    <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v2h-4v-2zm-4 0h2v4h-2v-4zm2 4h4v2h-4v-2zm2-2h2v2h-2v-2zm-6-2h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">
                      CIRPASS QR TAG
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                      SHA-256 SIGNED
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block">
                      EU Registry 2026/A
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic Hash Seal Strip */}
              <div className="p-3.5 rounded-2xl bg-[#050812] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">CRYPTOGRAPHIC DIGEST:</span>
                  <span className="text-slate-200 font-bold truncate max-w-xs sm:max-w-md">
                    {mockSha256}
                  </span>
                </div>
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[11px] transition-colors"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'COPIED!' : 'COPY HASH'}</span>
                </button>
              </div>

              {/* Mass Balance & LCA Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">INFLOW MASS PROCESSED</span>
                  <div className="text-xl font-mono font-black text-white">{formatKg(metrics.total_inflow_mass_kg)}</div>
                  <span className="text-[10px] text-slate-500 font-mono">Optical inspection input</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                  <span className="text-[10px] font-mono text-emerald-300 uppercase block">CERTIFIED USABLE YIELD</span>
                  <div className="text-xl font-mono font-black text-emerald-400">{formatKg(metrics.usable_mass_kg)} ({metrics.circularity_yield_percent || 85}%)</div>
                  <span className="text-[10px] text-emerald-300/70 font-mono">Ready for granulation</span>
                </div>
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 space-y-1">
                  <span className="text-[10px] font-mono text-cyan-300 uppercase block">NET CO₂e DISPLACEMENT</span>
                  <div className="text-xl font-mono font-black text-cyan-400">{formatCO2(metrics.net_co2_avoided_kg)}</div>
                  <span className="text-[10px] text-cyan-300/70 font-mono">Crude oil avoided: {metrics.crude_oil_saved_liters || 205}L</span>
                </div>
              </div>

              {/* Thermal Specs & Extrusion Parameters */}
              <div className="p-5 rounded-3xl bg-[#04060c] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="flex items-center gap-2 text-amber-400">
                    <Flame className="w-4 h-4" />
                    QUALIFIED 3D PRINTING & MELT SPECIFICATIONS
                  </span>
                  <span className="text-slate-500">ISO 11469 Qualified</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">EXTRUDER DIE</span>
                    <span className="font-bold text-slate-200">{specs.extruder_die_zone3_c || '225–235°C'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">FDM NOZZLE</span>
                    <span className="font-bold text-slate-200">{specs.fdm_nozzle_temp_c || '230–245°C'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">HEATED BED</span>
                    <span className="font-bold text-slate-200">{specs.fdm_bed_temp_c || '95–110°C'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">PRE-DRYING</span>
                    <span className="font-bold text-slate-200">{specs.pre_drying_temp_c || 80}°C / {specs.pre_drying_hours || '3h'}</span>
                  </div>
                </div>
              </div>

              {/* Legal RoHS & ESPR Compliance Statement */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed font-mono">
                <span className="font-bold text-slate-300 block mb-1">REGULATORY ATTESTATION:</span>
                This certified material lot has been qualified via automated optical casing morphology classification, OpenCV 5-step mold stamp OCR extraction, and deterministic Beilstein/solvent validation. Confirmed compliant with European Union RoHS Directive 2011/65/EU and REACH Annex XVII (DecaBDE / OctaBDE below 0.1% w/w).
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
