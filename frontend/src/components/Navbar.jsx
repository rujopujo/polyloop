import React from 'react';
import { motion } from 'framer-motion';
import {
  Scan,
  TestTube2,
  Flame,
  BarChart3,
  FileText,
  Recycle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const navItems = [
  { id: 'scanner', label: 'Scanner', icon: Scan },
  { id: 'diagnostic', label: 'Diagnostic', icon: TestTube2 },
  { id: 'thermal', label: 'Thermal', icon: Flame },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'passport', label: 'Passport', icon: FileText },
];

const statusConfig = {
  CONNECTED: { color: 'text-forest-400', bgColor: 'bg-forest-500/20', icon: CheckCircle2, label: 'Connected' },
  OPERATIONAL: { color: 'text-forest-400', bgColor: 'bg-forest-500/20', icon: CheckCircle2, label: 'Operational' },
  OFFLINE_MOCK: { color: 'text-earth-400', bgColor: 'bg-earth-500/20', icon: AlertCircle, label: 'Demo Mode' },
};

export default function Navbar({ activeTab, setActiveTab, systemStatus }) {
  const status = statusConfig[systemStatus] || statusConfig.OPERATIONAL;
  const StatusIcon = status.icon;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-forest-500 to-forest-600 rounded-xl blur-md opacity-40"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-forest-500 to-forest-600 rounded-xl flex items-center justify-center">
                <Recycle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold font-display gradient-text-forest">
                PolyLoop
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                E-Waste Polymer Intelligence
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${status.bgColor} border border-forest-500/30`}>
            <StatusIcon className={`w-4 h-4 ${status.color}`} />
            <span className={`text-sm font-semibold ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-br from-forest-500 to-forest-600 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
