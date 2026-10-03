import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  Leaf, 
  Fuel, 
  Flame, 
  Car, 
  Trash2, 
  Layers, 
  TrendingUp 
} from 'lucide-react';
import { api, FALLBACK_BATCH_METRICS } from '../services/api';
import { formatKg, formatCO2, formatPercent } from '../utils/formatting';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function LCAMetricsCard({ activeBatchId }) {
  const [metrics, setMetrics] = useState(FALLBACK_BATCH_METRICS);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(activeBatchId || 'BATCH-EWEM-PILOT-01');

  useEffect(() => {
    async function loadBatches() {
      const data = await api.getBatches();
      setBatches(data);
      if (data && data.length > 0 && !activeBatchId) {
        setSelectedBatchId(data[0].id);
      }
    }
    loadBatches();
  }, [activeBatchId]);

  useEffect(() => {
    async function fetchMetrics() {
      if (!selectedBatchId) return;
      const data = await api.getBatchMetrics(selectedBatchId);
      setMetrics(data);
    }
    fetchMetrics();
  }, [selectedBatchId]);

  // Carbon comparison bar chart data
  const comparisonData = [
    {
      name: 'Virgin Petrochemical Resin',
      kgCO2e: metrics.virgin_resin_carbon_kg || 362.5,
      fill: '#ef4444'
    },
    {
      name: 'PolyLoop Circular Process',
      kgCO2e: metrics.polyloop_process_carbon_kg || 66.3,
      fill: '#10b981'
    }
  ];

  // Pie chart data
  const compositionData = metrics.composition_breakdown?.map(item => ({
    name: item.polymer,
    value: item.mass_kg,
    percentage: item.percentage
  })) || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
      {/* Title & Batch Picker */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              ISO 14040/14044 Life Cycle Assessment (LCA) Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              Cradle-to-gate carbon displacement and circular mass balance metrics
            </p>
          </div>
        </div>

        {/* Batch Select */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Active Batch:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 font-mono focus:border-emerald-500"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Net CO2 Avoided */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Net CO₂e Prevented</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400">
            {formatCO2(metrics.net_co2_avoided_kg)}
          </div>
          <p className="text-[10px] text-slate-500">ISO 14040 virgin plastic displacement</p>
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Crude Oil Saved */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Crude Oil Saved</span>
            <Fuel className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-400">
            ~{Number(metrics.crude_oil_saved_liters || 0).toFixed(1)} L
          </div>
          <p className="text-[10px] text-slate-500">Direct fossil fuel extraction avoided</p>
          <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Coal Combustion Equivalent */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Coal Offset Equivalent</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-400">
            ~{Number(metrics.coal_offset_kg || 0).toFixed(1)} kg
          </div>
          <p className="text-[10px] text-slate-500">0.49 kg bituminous coal factor</p>
          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Landfill Mass Diverted */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-700 space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Usable Mass Upcycled</span>
            <Trash2 className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-slate-100">
            {formatKg(metrics.usable_mass_kg)}
          </div>
          <p className="text-[10px] text-slate-500">Circularity Yield: {formatPercent(metrics.circularity_yield_percent)}</p>
        </div>
      </div>

      {/* Visual Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Bar Chart: Virgin vs PolyLoop Carbon Footprint */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              Carbon Footprint Comparison (kg CO₂e)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              -81.7% Emission Reduction
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" kg" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="kgCO2e" radius={[4, 4, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Batch Composition Breakdown */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              Batch Polymer Composition & BFR Segregation
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Total Inflow: {formatKg(metrics.total_inflow_mass_kg)}
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compositionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val, name) => [`${val} kg (${((val / metrics.total_inflow_mass_kg) * 100).toFixed(1)}%)`, name]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-slate-300 text-xs font-mono">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
