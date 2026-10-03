import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  FileDown, 
  Eye, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import { formatKg, formatCO2, formatDateTime } from '../utils/formatting';

export default function BatchManager({ 
  recentScans = [], 
  onViewPassport, 
  onBatchCreated 
}) {
  const [batches, setBatches] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [targetPolymer, setTargetPolymer] = useState('ABS');
  const [selectedScanIds, setSelectedScanIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const data = await api.getBatches();
    setBatches(data);
  };

  const handleToggleScan = (id) => {
    setSelectedScanIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchName) return;

    setIsSubmitting(true);
    try {
      // Build items array
      const items = selectedScanIds.length > 0 
        ? selectedScanIds.map(id => ({ scan_id: id, mass_kg: 2.5 }))
        : [{ scan_id: "DEMO-SCAN-ABS-01", mass_kg: 10.0 }];

      const newBatch = await api.createBatch({
        name: batchName,
        polymer_type: targetPolymer,
        items
      });

      setShowCreateModal(false);
      setBatchName('');
      setSelectedScanIds([]);
      await loadBatches();
      if (onBatchCreated) {
        onBatchCreated(newBatch.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerDownload = (batchId) => {
    window.open(`/api/passport/${batchId}/pdf`, '_blank');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
      {/* Title & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Recycling Batch Manager & Passport Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Aggregate verified scans into certified production lots with tamper-evident PDF passports
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          <span>New Recycling Batch</span>
        </button>
      </div>

      {/* Batches Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Batch ID & Reference</th>
              <th className="py-3 px-3">Polymer</th>
              <th className="py-3 px-3">Total Inflow</th>
              <th className="py-3 px-3">Usable Yield</th>
              <th className="py-3 px-3">Net CO₂ Avoided</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-slate-800/30 transition">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-200">{b.name}</div>
                  <div className="font-mono text-[10px] text-emerald-400">{b.id}</div>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-slate-300">
                  {b.polymer_type}
                </td>
                <td className="py-3 px-3 font-mono text-slate-300">
                  {formatKg(b.total_mass_kg)}
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-emerald-400 font-semibold">
                    {formatKg(b.usable_mass_kg)}
                  </span>
                  {b.rejected_mass_kg > 0 && (
                    <span className="text-[10px] text-rose-400 block font-mono">
                      -{formatKg(b.rejected_mass_kg)} (BFR)
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 font-mono text-cyan-400 font-bold">
                  {formatCO2(b.co2_avoided_kg)}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => onViewPassport(b.id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition text-[11px]"
                    title="View Passport Preview"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => triggerDownload(b.id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-medium transition text-[11px]"
                    title="Download Official PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Creating New Batch */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-emerald-400" />
                <span>Initialize Recycling Production Batch</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-300 font-mono text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Batch Name / Reference Lot</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lot 44 - Sorted ABS Keyboard Scrap"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Target Polymer Family</label>
                <select
                  value={targetPolymer}
                  onChange={(e) => setTargetPolymer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="ABS">ABS (Acrylonitrile Butadiene Styrene)</option>
                  <option value="HIPS">HIPS (High-Impact Polystyrene)</option>
                  <option value="PC-ABS">PC-ABS (Polycarbonate Alloy)</option>
                  <option value="PC">PC (Polycarbonate)</option>
                </select>
              </div>

              {/* Scans selection */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium block">
                  Select Verified Inflow Scans ({selectedScanIds.length} chosen)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  {recentScans.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic py-2 text-center">
                      No live scans queued yet. Default demo scan will be seeded.
                    </p>
                  ) : (
                    recentScans.map((s) => (
                      <label 
                        key={s.id} 
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                          selectedScanIds.includes(s.id) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedScanIds.includes(s.id)}
                            onChange={() => handleToggleScan(s.id)}
                            className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                          />
                          <span className="font-mono text-slate-300">{s.detected_polymer}</span>
                          <span className="text-[10px] text-slate-500">({s.casing_type})</span>
                        </div>
                        <span className={`text-[10px] font-mono ${s.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {s.status}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {isSubmitting ? 'Calculating LCA...' : 'Create Batch & Passport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
