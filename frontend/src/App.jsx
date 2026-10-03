import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import CameraHUD from './components/CameraHUD';
import ScanResultsCard from './components/ScanResultsCard';
import DiagnosticWizard from './components/DiagnosticWizard';
import ThermalSpecsCard from './components/ThermalSpecsCard';
import LCAMetricsCard from './components/LCAMetricsCard';
import BatchManager from './components/BatchManager';
import PassportModal from './components/PassportModal';
import { sound } from './utils/sound';
import {
  Recycle,
  Leaf,
  Zap,
  TrendingDown,
  Factory
} from 'lucide-react';

// Stats Ticker Data
const STATS = [
  { icon: Recycle, label: 'Plastic Recycled', value: '2,490 kg', color: 'text-forest-400' },
  { icon: TrendingDown, label: 'CO₂ Saved', value: '7,120 kg', color: 'text-ocean-400' },
  { icon: Leaf, label: 'Oil Saved', value: '5,180 L', color: 'text-forest-400' },
  { icon: Factory, label: 'BFR Detection', value: '99.4%', color: 'text-earth-400' },
  { icon: Zap, label: 'Scan Speed', value: '18.4 ms', color: 'text-ocean-400' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [currentScan, setCurrentScan] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [activePolymer, setActivePolymer] = useState('ABS');
  const [activeBatchId, setActiveBatchId] = useState('BATCH-EWEM-PILOT-01');
  const [passportModalBatchId, setPassportModalBatchId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState('OPERATIONAL');

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setSystemStatus('CONNECTED');
      } catch {
        setSystemStatus('OFFLINE_MOCK');
      }
    }
    checkHealth();
  }, []);

  const handleScanComplete = (scanData) => {
    setCurrentScan(scanData);
    if (scanData.polymer_detected && scanData.polymer_detected !== 'UNKNOWN') {
      setActivePolymer(scanData.polymer_detected);
    }
    setRecentScans(prev => [scanData, ...prev]);
  };

  const handleDiagnosticComplete = (diagData) => {
    setCurrentScan(diagData);
    if (diagData.polymer_detected && diagData.polymer_detected !== 'UNKNOWN') {
      setActivePolymer(diagData.polymer_detected);
    }
    setRecentScans(prev => [diagData, ...prev]);
  };

  const handleAddToBatch = (scan) => {
    sound.playBlip(700, 0.05);
    setActiveTab('passport');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
      />

      {/* Stats Ticker */}
      <div className="border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-sm py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 overflow-x-auto pb-2 scrollbar-hide">
            {STATS.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="flex items-center gap-3 whitespace-nowrap">
                  <div className="w-8 h-8 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <AnimatePresence mode="wait">

          {/* Scanner Tab */}
          {activeTab === 'scanner' && (
            <motion.div
              key="scanner-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold font-display mb-2">
                      Vision Scanner & OCR
                    </h2>
                    <p className="text-slate-400">
                      YOLOv8n classification + ISO 11469 mold stamp recognition
                    </p>
                  </div>
                  <div className="badge-success text-sm">
                    <div className="w-2 h-2 rounded-full bg-forest-400 animate-pulse"></div>
                    Zero-Cost AI Active
                  </div>
                </div>
              </div>

              {/* Scanner Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <CameraHUD
                    onScanComplete={handleScanComplete}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                </div>
                <div className="lg:col-span-5">
                  <ScanResultsCard
                    result={currentScan}
                    onAddToBatch={handleAddToBatch}
                    onOpenDiagnostic={() => { sound.playBlip(600, 0.04); setActiveTab('diagnostic'); }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Diagnostic Tab */}
          {activeTab === 'diagnostic' && (
            <motion.div
              key="diagnostic-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DiagnosticWizard onDiagnosticComplete={handleDiagnosticComplete} />
            </motion.div>
          )}

          {/* Thermal Tab */}
          {activeTab === 'thermal' && (
            <motion.div
              key="thermal-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ThermalSpecsCard activePolymer={activePolymer} />
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LCAMetricsCard activeBatchId={activeBatchId} />
            </motion.div>
          )}

          {/* Passport Tab */}
          {activeTab === 'passport' && (
            <motion.div
              key="passport-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BatchManager
                recentScans={recentScans}
                onViewPassport={(batchId) => { sound.playBlip(700, 0.04); setPassportModalBatchId(batchId); }}
                onBatchCreated={(newId) => {
                  setActiveBatchId(newId);
                  setActiveTab('analytics');
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Passport Modal */}
      {passportModalBatchId && (
        <PassportModal
          batchId={passportModalBatchId}
          isOpen={!!passportModalBatchId}
          onClose={() => { sound.playClick(); setPassportModalBatchId(null); }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-900/30 backdrop-blur-sm py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">PolyLoop</span>
              <span>•</span>
              <span>Zero-Cost E-Waste Polymer Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <span>ISO 14040 & RoHS Compliant</span>
              <span>•</span>
              <span className="text-forest-400 font-semibold">Open Source</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
