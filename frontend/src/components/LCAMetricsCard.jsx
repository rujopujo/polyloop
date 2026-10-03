import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Leaf, Fuel, Flame, Trash2, Car, Trees, 
  Zap, Globe, Sliders, ArrowUpRight, ShieldCheck
} from 'lucide-react';
import { api, FALLBACK_BATCH_METRICS } from '../services/api';
import { formatKg, formatCO2, formatPercent } from '../utils/formatting';
import { sound } from '../utils/sound';

const PIE_COLORS = ['#0df2a4', '#00f0ff', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function LCAMetricsCard({ activeBatchId }) {
  const [metrics, setMetrics] = useState(FALLBACK_BATCH_METRICS);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(activeBatchId || 'BATCH-EWEM-PILOT-01');
  const [lotMultiplier, setLotMultiplier] = useState(1); // multiplier for scale slider

  useEffect(() => {
    async function loadBatches() {
      const data = await api.getBatches();
      setBatches(data);
      if (data?.length > 0 && !activeBatchId) setSelectedBatchId(data[0].id);
    }
    loadBatches();
  }, [activeBatchId]);

  useEffect(() => {
    if (!selectedBatchId) return;
    api.getBatchMetrics(selectedBatchId).then(setMetrics);
  }, [selectedBatchId]);

  const handleBatchChange = (e) => {
    sound.playClick();
    setSelectedBatchId(e.target.value);
  };

  const handleSliderChange = (e) => {
    setLotMultiplier(Number(e.target.value));
  };

  const scaledCO2 = ((metrics.net_co2_avoided_kg || 284.7) * lotMultiplier).toFixed(1);
  const scaledOil = ((metrics.crude_oil_saved_liters || 205.5) * lotMultiplier).toFixed(1);
  const scaledKm = Math.round((metrics.km_driven_offset || 1158.7) * lotMultiplier);
  const scaledTrees = (scaledCO2 / 21.7).toFixed(1); // 1 mature tree absorbs ~21.7kg CO2/year

  const comparisonData = [
    { name: 'Virgin Petrochemical Resin', kgCO2e: Math.round((metrics.virgin_resin_carbon_kg || 362.5) * lotMultiplier), fill: '#ef4444' },
    { name: 'PolyLoop Circular Re-Extrusion', kgCO2e: Math.round((metrics.polyloop_process_carbon_kg || 66.3) * lotMultiplier), fill: '#0df2a4' }
  ];

  const compositionData = metrics.composition_breakdown?.map(item => ({
    name: item.polymer, 
    value: item.mass_kg * lotMultiplier, 
    percentage: item.percentage
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-elevated rounded-3xl p-6 sm:p-8 space-y-8 relative overflow-hidden"
    >
      {/* Header & Batch Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(13,242,164,0.2)]">
            <Leaf className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-white tracking-tight flex items-center gap-2">
              ISO 14040 / 14044 LIFE CYCLE ASSESSMENT (LCA)
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Cradle-to-Gate Carbon Displacement • Scope 3 Inflow Telemetry
            </p>
          </div>
        </div>

        <select
          value={selectedBatchId}
          onChange={handleBatchChange}
          className="bg-[#04060c] border border-white/[0.1] text-slate-200 text-xs rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:border-emerald-400 cursor-pointer shadow-inner"
        >
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Scale Simulator Slider */}
      <div className="p-4 rounded-2xl bg-[#040710] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-slate-200">
            SIMULATE INFLOW SCALE:
          </span>
        </div>
        <div className="flex-1 max-w-md flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500">1x (100 kg)</span>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={lotMultiplier}
            onChange={handleSliderChange}
            className="flex-1 accent-emerald-400 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-slate-500">25x (2.5 tons)</span>
        </div>
        <span className="px-3 py-1 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 font-mono text-xs font-black">
          {lotMultiplier}x LOT MULTIPLIER ({lotMultiplier * 100} kg)
        </span>
      </div>

      {/* Primary KPI Grid with Real-World Equivalents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Carbon Avoidance */}
        <div className="p-5 rounded-3xl bg-[#04060c] border border-emerald-400/30 space-y-2 relative overflow-hidden group">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>NET CO₂e AVOIDED</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 glow-text-mint">
            +{scaledCO2} kg
          </div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-1">
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>Eq. to <strong>{scaledTrees}</strong> mature trees / yr</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 blur-2xl pointer-events-none" />
        </div>

        {/* Metric 2: Crude Oil Saved */}
        <div className="p-5 rounded-3xl bg-[#04060c] border border-cyan-400/30 space-y-2 relative overflow-hidden group">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>CRUDE OIL SAVED</span>
            <Fuel className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-400 glow-text-cyan">
            {scaledOil} L
          </div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{(scaledOil / 159).toFixed(1)} barrels crude avoided</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 blur-2xl pointer-events-none" />
        </div>

        {/* Metric 3: EV Km Equivalent */}
        <div className="p-5 rounded-3xl bg-[#04060c] border border-amber-400/30 space-y-2 relative overflow-hidden group">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>MOBILITY OFFSET</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
            {scaledKm.toLocaleString()} km
          </div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>EV driving emissions avoided</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 blur-2xl pointer-events-none" />
        </div>

        {/* Metric 4: Circularity Yield */}
        <div className="p-5 rounded-3xl bg-[#04060c] border border-purple-400/30 space-y-2 relative overflow-hidden group">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>CIRCULAR YIELD</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-purple-400">
            {metrics.circularity_yield_percent || 85.0}%
          </div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 pt-1">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>15% quarantined for BFR</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/5 blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* High-Impact Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Carbon Comparative Bar Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#04060c] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-white text-sm">
                CARBON FOOTPRINT COMPARATIVE ANALYSIS (kg CO₂e)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Virgin Petrochemical vs. PolyLoop Optical + Desktop Extrusion
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 font-mono text-xs font-bold border border-emerald-400/30">
              81.7% REDUCTION
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical" margin={{ top: 15, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} width={140} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#090d16', 
                    borderColor: 'rgba(255,255,255,0.15)', 
                    borderRadius: '12px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#fff' 
                  }} 
                />
                <Bar dataKey="kgCO2e" radius={[0, 8, 8, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lot Inflow Composition Donut */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#04060c] border border-white/[0.08] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-white text-sm">
              LOT RESIN COMPOSITION BALANCE
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Inflow segregation breakdown by mass
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#090d16', 
                    borderColor: 'rgba(255,255,255,0.15)', 
                    borderRadius: '12px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#fff' 
                  }}
                  formatter={(val) => [`${Number(val).toFixed(1)} kg`, 'Mass']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            {compositionData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span className="text-slate-300 font-bold">{item.name}:</span>
                <span className="text-slate-500">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
