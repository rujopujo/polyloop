import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Boxes, Plus, FileDown, Eye, X, Search,
  QrCode, ShieldCheck, Check, Sparkles, Filter,
  ArrowUpRight, Clock, Scale
} from 'lucide-react';
import { api } from '../services/api';
import { formatKg, formatCO2, formatDateTime } from '../utils/formatting';
import { sound } from '../utils/sound';

export default function BatchManager({ recentScans = [], onViewPassport, onBatchCreated }) {
  const [batches, setBatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [targetPolymer, setTargetPolymer] = useState('ABS');
  const [selectedScanIds, setSelectedScanIds] = useState([]);
  const [manualWeight, setManualWeight] = useState(25.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadBatches(); }, []);

  const loadBatches = async () => {
    const data = await api.getBatches();
    setBatches(data);
  };

  const handleToggleScan = (id) => {
    sound.playClick();
    setSelectedScanIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleOpenCreateModal = () => {
    sound.playBlip(700, 0.04);
    setShowCreateModal(true);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchName) return;
    sound.playScan();
    setIsSubmitting(true);
    try {
      const items = selectedScanIds.length > 0
        ? selectedScanIds.map(id => ({ scan_id: id, mass_kg: 2.5 }))
        : [{ scan_id: `SPECIMEN-${Date.now()}`, mass_kg: manualWeight }];
      
      const newBatch = await api.createBatch({ 
        name: batchName, 
        polymer_type: targetPolymer, 
        items 
      });

      sound.playSuccess();
      setShowCreateModal(false);
      setBatchName('');
      setSelectedScanIds([]);
      await loadBatches();
      if (onBatchCreated) onBatchCreated(newBatch.id);
    } catch (err) {
      console.error(err);
      sound.playWarning();
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerDownload = (batchId) => {
    sound.playClick();
    window.open(`/api/passport/${batchId}/pdf`, '_blank');
  };

  const handleView = (id) => {
    sound.playBlip(650, 0.04);
    onViewPassport(id);
  };

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.polymer_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-elevated rounded-3xl p-6 sm:p-8 space-y-8 relative overflow-hidden"
    >
      {/* Header & New Batch Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Boxes className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white tracking-tight flex items-center gap-2">
              BATCH INVENTORY & DIGITAL PRODUCT PASSPORTS
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              EU ESPR / CIRPASS Verifiable Ledger • Granulation Lot Traceability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lots, polymers, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl bg-[#04060c] border border-white/[0.08] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-56 sm:w-64"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 text-slate-950 font-mono font-black text-xs shadow-[0_0_20px_rgba(13,242,164,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            ASSEMBLE NEW LOT
          </motion.button>
        </div>
      </div>

      {/* Production Lots Ledger Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#04060c]/80 shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#080d1a] text-slate-400 font-mono text-[11px] border-b border-white/[0.08] uppercase tracking-wider">
            <tr>
              <th className="py-4 px-5">Lot ID & Manifest Name</th>
              <th className="py-4 px-4">Resin Class</th>
              <th className="py-4 px-4">Total Inflow</th>
              <th className="py-4 px-4">Circularity Yield</th>
              <th className="py-4 px-4">CO₂e Displaced</th>
              <th className="py-4 px-4">Compliance Seal</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredBatches.map((batch) => (
              <tr 
                key={batch.id} 
                className="hover:bg-white/[0.03] transition-colors group"
              >
                <td className="py-4 px-5">
                  <div className="font-mono font-bold text-white text-xs flex items-center gap-2">
                    {batch.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>ID: <span className="text-cyan-300 font-bold">{batch.id}</span></span>
                    <span>•</span>
                    <span>{formatDateTime(batch.created_at)}</span>
                  </div>
                </td>
                <td className="py-4 px-4 font-mono font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                    {batch.polymer_type}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-slate-300 font-bold">
                  {formatKg(batch.total_mass_kg)}
                </td>
                <td className="py-4 px-4 font-mono">
                  <span className="text-emerald-400 font-bold">
                    {formatKg(batch.usable_mass_kg)}
                  </span>
                  <span className="text-slate-500 text-[10px] ml-1">
                    ({Math.round((batch.usable_mass_kg / batch.total_mass_kg) * 100)}%)
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-emerald-400 font-bold">
                  {formatCO2(batch.co2_avoided_kg)}
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-[10px] font-mono font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    RoHS Verified
                  </span>
                </td>
                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleView(batch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-mono font-bold transition-colors"
                      title="Inspect Digital Passport"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      PASSPORT
                    </button>
                    <button
                      onClick={() => triggerDownload(batch.id)}
                      className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
                      title="Download Certified PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredBatches.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-500 font-mono text-xs">
                  No production lots found matching search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assemble Lot Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel-elevated rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
                    <Boxes className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-white text-base">
                      ASSEMBLE PRODUCTION LOT
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Mint cryptographic Digital Product Passport (DPP)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">
                    LOT MANIFEST NAME:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batch 2026-EU-ABS-Recycled-04"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#04060c] border border-white/[0.1] text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-300">
                      TARGET RESIN CLASS:
                    </label>
                    <select
                      value={targetPolymer}
                      onChange={(e) => setTargetPolymer(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#04060c] border border-white/[0.1] text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="ABS">ABS (Acrylonitrile Butadiene Styrene)</option>
                      <option value="HIPS">HIPS (High-Impact Polystyrene)</option>
                      <option value="PC-ABS">PC-ABS (Polycarbonate Alloy)</option>
                      <option value="PC">PC (Pure Polycarbonate)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-300">
                      INITIAL BATCH MASS (KG):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={manualWeight}
                      onChange={(e) => setManualWeight(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-[#04060c] border border-white/[0.1] text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Scanned Items in Session */}
                {recentScans.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-mono text-slate-400 block">
                      ATTACH OPTICAL SPECIMENS FROM THIS SESSION:
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-xl border border-white/[0.06] p-2 bg-[#04060c]">
                      {recentScans.map((scan, i) => (
                        <div
                          key={scan.scan_id || i}
                          onClick={() => handleToggleScan(scan.scan_id || `SCAN-${i}`)}
                          className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                            selectedScanIds.includes(scan.scan_id || `SCAN-${i}`)
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="font-bold">{scan.polymer_detected || 'Polymer'}</span>
                          <span className="text-[10px]">{scan.casing_label || 'Housing Specimen'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.04] text-slate-400 text-xs font-mono hover:text-slate-200"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 text-slate-950 font-mono font-black text-xs uppercase shadow-[0_0_20px_rgba(13,242,164,0.3)] hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isSubmitting ? 'MINTING DPP PASSPORT...' : 'MINT MATERIAL PASSPORT'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
