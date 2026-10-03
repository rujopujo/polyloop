import React from 'react';
import { 
  Scan, 
  FlaskConical, 
  Flame, 
  BarChart3, 
  FileCheck2, 
  Cpu, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemStatus = "READY" }) {
  const tabs = [
    { id: 'scanner', label: 'Vision & Stamp HUD', icon: Scan },
    { id: 'diagnostic', label: 'Diagnostic Wizard', icon: FlaskConical },
    { id: 'thermal', label: 'Thermal & Extrusion', icon: Flame },
    { id: 'analytics', label: 'Batch LCA Telemetry', icon: BarChart3 },
    { id: 'passport', label: 'Digital Passports', icon: FileCheck2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider text-slate-100 font-mono">POLY<span className="text-emerald-400">LOOP</span></span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 font-semibold">ZERO-COST v1.0</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automated E-Waste Polymer Qualification & Upcycling</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System Status Indicators */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">CORE: <span className="text-emerald-400 font-semibold">{systemStatus}</span></span>
            </div>
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 border-l border-slate-800 pl-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-[11px]">RoHS / POPs Active</span>
            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800/80 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
