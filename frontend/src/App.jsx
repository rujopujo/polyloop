import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CameraHUD from './components/CameraHUD';
import ScanResultsCard from './components/ScanResultsCard';
import DiagnosticWizard from './components/DiagnosticWizard';
import ThermalSpecsCard from './components/ThermalSpecsCard';
import LCAMetricsCard from './components/LCAMetricsCard';
import BatchManager from './components/BatchManager';
import PassportModal from './components/PassportModal';
import { api, FALLBACK_POLYMERS } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [currentScan, setCurrentScan] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [activePolymer, setActivePolymer] = useState('ABS');
  const [activeBatchId, setActiveBatchId] = useState('BATCH-EWEM-PILOT-01');
  const [passportModalBatchId, setPassportModalBatchId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState('OPERATIONAL');

  // Load initial scans or health check
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setSystemStatus('CONNECTED');
      } catch {
        setSystemStatus('OFFLINE_MOCK');
      }
    }
    init();
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
    // Switch to passport tab and let user finalize
    setActiveTab('passport');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col bg-grid-pattern selection:bg-emerald-500/20 selection:text-emerald-300">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        systemStatus={systemStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Live Camera & Stamp Scanner */}
        {activeTab === 'scanner' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Context Banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-100 font-mono">
                  STAGE 1 & 2: AUTOMATED COMPUTER VISION & MOLD STAMP OCR
                </h1>
                <p className="text-xs text-slate-400">
                  Dual-tier inference: YOLOv8 casing typology + OpenCV CLAHE & EasyOCR ISO 11469 parser
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zero-Cost Edge Pipeline Active</span>
              </div>
            </div>

            {/* Split Screen HUD & Output */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
                  onOpenDiagnostic={() => setActiveTab('diagnostic')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Diagnostic Decision Wizard */}
        {activeTab === 'diagnostic' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <DiagnosticWizard onDiagnosticComplete={handleDiagnosticComplete} />
          </div>
        )}

        {/* Tab 3: Thermal Rheology & Extrusion */}
        {activeTab === 'thermal' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ThermalSpecsCard activePolymer={activePolymer} />
          </div>
        )}

        {/* Tab 4: Batch LCA Telemetry */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <LCAMetricsCard activeBatchId={activeBatchId} />
          </div>
        )}

        {/* Tab 5: Digital Material Passports */}
        {activeTab === 'passport' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <BatchManager 
              recentScans={recentScans}
              onViewPassport={(batchId) => setPassportModalBatchId(batchId)}
              onBatchCreated={(newId) => {
                setActiveBatchId(newId);
                setActiveTab('analytics');
              }}
            />
          </div>
        )}
      </main>

      {/* Passport Preview Modal */}
      {passportModalBatchId && (
        <PassportModal 
          batchId={passportModalBatchId}
          isOpen={!!passportModalBatchId}
          onClose={() => setPassportModalBatchId(null)}
        />
      )}

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono gap-2">
          <div>
            PolyLoop • 100% Free Open-Source E-Waste Polymer Qualification Platform
          </div>
          <div className="flex items-center space-x-3">
            <span>FastAPI + YOLOv8 + OpenCV + EasyOCR + React</span>
            <span>•</span>
            <span className="text-emerald-400">ISO 14040 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
