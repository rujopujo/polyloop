import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, RefreshCw, Scan, Play, X, Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';
import { sound } from '../utils/sound';

const SAMPLE_PRESETS = [
  { id: 'keyboard_abs_stamp.png', label: 'Keyboard (ABS)', status: 'Clean' },
  { id: 'laptop_pcabs_stamp.png', label: 'Laptop (PC-ABS)', status: 'Clean' },
  { id: 'crt_hips_stamp.png', label: 'CRT Monitor (HIPS)', status: 'Standard' },
  { id: 'hazardous_crt_fr40_stamp.png', label: 'Vintage TV (FR-40)', status: 'Hazard' }
];

export default function CameraHUD({ onScanComplete, isProcessing, setIsProcessing }) {
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready to scan');
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    sound.playClick();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setCapturedImage(null);
        setStatusMessage('Camera active - Frame your sample');
      }
    } catch {
      setStatusMessage('Camera unavailable - Use file upload');
    }
  };

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreamActive(false);
  };

  const captureSnapshot = () => {
    sound.playClick();
    if (!videoRef.current) return;
    const v = videoRef.current;
    const c = document.createElement('canvas');
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    setCapturedImage(c.toDataURL('image/jpeg', 0.95));
    stopCamera();
    setStatusMessage('Image captured - Ready to analyze');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sound.playClick();
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result);
      stopCamera();
      setStatusMessage('Image loaded - Ready to analyze');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (filename) => {
    sound.playBlip(750, 0.05);
    try {
      const res = await fetch(`/api/samples/test-stamps/${filename}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result);
        stopCamera();
        setStatusMessage('Sample loaded - Ready to analyze');
      };
      reader.readAsDataURL(blob);
    } catch {
      // Fallback synthetic
      const c = document.createElement('canvas');
      c.width = 640; c.height = 480;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);

      ctx.font = 'bold 48px monospace';
      ctx.fillStyle = '#22c55e';
      ctx.textAlign = 'center';
      const label = filename.includes('hips') ? '>PS-HI<' : (filename.includes('pcabs') ? '>PC+ABS<' : (filename.includes('fr40') ? '>ABS-FR(40)<' : '>ABS<'));
      ctx.fillText(label, 320, 240);

      setCapturedImage(c.toDataURL('image/png'));
      stopCamera();
      setStatusMessage('Sample loaded - Ready to analyze');
    }
  };

  const executeAnalysis = async () => {
    if (!capturedImage) return;
    sound.playScan();
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Analyzing casing type...');

    try {
      const blob = await (await fetch(capturedImage)).blob();
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });

      setProgress(25);
      const casingRes = await api.scanCasing(file);

      setProgress(50);
      setStatusMessage('Extracting polymer code...');
      await new Promise(r => setTimeout(r, 400));

      const stampRes = await api.scanStamp(file, casingRes.casing_type, casingRes.vintage_era);

      setProgress(75);
      setStatusMessage('Calculating BFR risk...');
      await new Promise(r => setTimeout(r, 300));

      if (stampRes.rohs_compliant) {
        sound.playSuccess();
      } else {
        sound.playWarning();
      }

      setProgress(100);
      setStatusMessage('Analysis complete');

      onScanComplete({
        ...stampRes,
        casing_type: casingRes.casing_type,
        casing_label: casingRes.label,
        vintage_era: casingRes.vintage_era,
        baseline_bfr_risk: casingRes.baseline_bfr_risk
      });
    } catch (err) {
      console.error(err);
      sound.playWarning();
      setStatusMessage('Analysis failed - Check connection');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="card p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-display mb-1">Camera Scanner</h3>
          <p className="text-sm text-slate-400">Capture or upload plastic sample</p>
        </div>
        <div className="badge-info">
          <Scan className="w-3.5 h-3.5" />
          AI Vision
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">

        {/* Video Stream */}
        {streamActive && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Captured Image */}
        {!streamActive && capturedImage && (
          <img
            src={capturedImage}
            alt="Captured sample"
            className="w-full h-full object-contain"
          />
        )}

        {/* Empty State */}
        {!streamActive && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm mb-6">No image loaded</p>
            <div className="flex gap-3">
              <button onClick={startCamera} className="btn-primary">
                <Camera className="w-4 h-4" />
                Start Camera
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>
          </div>
        )}

        {/* Scan Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-4 border-forest-500 border-t-transparent animate-spin mx-auto mb-4"></div>
              <p className="text-white font-semibold">{statusMessage}</p>
              <div className="w-48 h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-forest-500 to-forest-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {streamActive ? (
          <div className="flex gap-3">
            <button onClick={captureSnapshot} className="btn-primary flex-1">
              <Scan className="w-4 h-4" />
              Capture Image
            </button>
            <button onClick={stopCamera} className="btn-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            {!capturedImage && (
              <>
                <button onClick={startCamera} className="btn-secondary flex-1">
                  <Camera className="w-4 h-4" />
                  Camera
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1">
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </>
            )}
            {capturedImage && (
              <>
                <button
                  onClick={executeAnalysis}
                  disabled={isProcessing}
                  className="btn-primary flex-1"
                >
                  <Play className="w-4 h-4" />
                  Start Analysis
                </button>
                <button onClick={() => setCapturedImage(null)} className="btn-secondary">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Sample Presets */}
        <div className="border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-500 font-medium mb-2">Test Samples:</p>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_PRESETS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  sample.status === 'Hazard'
                    ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{sample.label}</p>
                    <p className={`text-xs ${sample.status === 'Hazard' ? 'text-red-400' : 'text-slate-500'}`}>
                      {sample.status}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Status Bar */}
      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800">
        <div className="w-2 h-2 rounded-full bg-forest-400 animate-pulse"></div>
        {statusMessage}
      </div>
    </div>
  );
}
