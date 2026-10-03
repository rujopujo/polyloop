import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  Layers, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  FileImage,
  ScanText
} from 'lucide-react';
import { api } from '../services/api';

export default function CameraHUD({ onScanComplete, isProcessing, setIsProcessing }) {
  const [streamActive, setStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [capturedImage, setCapturedImage] = useState(null);
  const [sampleList, setSampleList] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [preprocessedPreview, setPreprocessedPreview] = useState(null);
  const [casingClassification, setCasingClassification] = useState(null);
  const [boundingBox, setBoundingBox] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Position mold stamp inside reticle');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch synthetic samples on mount
  useEffect(() => {
    async function loadSamples() {
      const samples = await api.getTestStamps();
      setSampleList(samples);
    }
    loadSamples();
  }, []);

  // WebRTC Camera Management
  const startCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
        setCapturedImage(null);
        setStatusMessage('Live camera stream active. Ready for capture.');
      }
    } catch (err) {
      console.warn("Webcam access unavailable or blocked:", err);
      setStatusMessage('Webcam access unavailable. Using synthetic sample images.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (streamActive) {
      setTimeout(() => startCamera(), 100);
    }
  };

  // Capture frame from video to canvas
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
    setStatusMessage('Snapshot captured. Ready to analyze.');
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result);
      stopCamera();
      setStatusMessage(`Loaded image: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Load pre-bundled synthetic sample
  const handleSelectSample = async (sampleName) => {
    setSelectedSample(sampleName);
    if (!sampleName) return;

    try {
      const res = await fetch(`/api/samples/test-stamps/${sampleName}`);
      if (!res.ok) throw new Error("Could not fetch sample");
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result);
        stopCamera();
        setStatusMessage(`Loaded synthetic e-waste sample: ${sampleName}`);
      };
      reader.readAsDataURL(blob);
    } catch {
      // Fallback: draw synthetic canvas stamp directly
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#222831';
      ctx.fillRect(0, 0, 640, 480);
      ctx.font = 'bold 36px monospace';
      ctx.fillStyle = '#393e46';
      ctx.fillText('>ABS<', 260, 250);
      ctx.fillStyle = '#eeeeee';
      ctx.fillText('>ABS<', 258, 248);
      const url = canvas.toDataURL('image/png');
      setCapturedImage(url);
      stopCamera();
    }
  };

  // Run full identification analysis
  const executeAnalysis = async () => {
    if (!capturedImage) {
      setStatusMessage('Please capture a frame or select a sample image first.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Step 1/2: Identifying electronic housing typology (YOLOv8)...');

    try {
      // Convert data URL to Blob/File
      const blob = await (await fetch(capturedImage)).blob();
      const imageFile = new File([blob], "casing_scan.jpg", { type: "image/jpeg" });

      // 1. Casing Classification
      const casingRes = await api.scanCasing(imageFile);
      setCasingClassification(casingRes);
      if (casingRes.bounding_box) {
        setBoundingBox(casingRes.bounding_box);
      }

      setStatusMessage('Step 2/2: Applying OpenCV 5-step filtering & EasyOCR stamp reading...');

      // 2. Mold Stamp Scan
      const stampRes = await api.scanStamp(imageFile, casingRes.casing_type, casingRes.vintage_era);
      if (stampRes.preprocessed_image_base64) {
        setPreprocessedPreview(stampRes.preprocessed_image_base64);
      }

      setStatusMessage('Analysis complete. Polymer verified & BFR risk screened.');
      onScanComplete({
        ...stampRes,
        casing_type: casingRes.casing_type,
        casing_label: casingRes.label,
        vintage_era: casingRes.vintage_era,
        baseline_bfr_risk: casingRes.baseline_bfr_risk
      });
    } catch (err) {
      console.error(err);
      setStatusMessage('Error during analysis. Please check server or retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top HUD Bar */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-5 h-5 text-emerald-400" />
          <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
            Webcam Targeting HUD & ROI Cropper
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Sample Selector */}
          <select
            value={selectedSample}
            onChange={(e) => handleSelectSample(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="">-- Load Synthetic E-Waste Sample --</option>
            {sampleList.map((s) => (
              <option key={s.filename} value={s.filename}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 font-medium transition"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Viewport & Overlay */}
      <div className="relative aspect-video max-h-[460px] bg-black flex items-center justify-center overflow-hidden">
        {/* Live Video Feed */}
        {streamActive && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Captured / Uploaded Image */}
        {!streamActive && capturedImage && (
          <img
            src={capturedImage}
            alt="Captured E-Waste Casing"
            className="w-full h-full object-contain"
          />
        )}

        {/* Standby Placeholder */}
        {!streamActive && !capturedImage && (
          <div className="text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
              <Camera className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">No Active Visual Input</p>
              <p className="text-xs text-slate-400 mt-1">Start your webcam, upload an image, or load a synthetic test stamp.</p>
            </div>
            <button
              onClick={startCamera}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Initialize Live Camera</span>
            </button>
          </div>
        )}

        {/* Targeting Reticle & Visual Bounding Boxes */}
        {(streamActive || capturedImage) && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Center Reticle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-emerald-400/60 rounded-lg relative">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 bg-slate-950/70 px-1 rounded">
                  ISO MOLD STAMP ROI
                </div>
              </div>
            </div>

            {/* Scanning Laser Line when processing */}
            {isProcessing && (
              <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-scanline" />
            )}

            {/* Bounding Box Overlay if available */}
            {boundingBox && (
              <div 
                className="absolute border-2 border-cyan-400/80 rounded bg-cyan-500/10 pointer-events-none"
                style={{
                  left: `${(boundingBox[0] / 640) * 100}%`,
                  top: `${(boundingBox[1] / 480) * 100}%`,
                  width: `${((boundingBox[2] - boundingBox[0]) / 640) * 100}%`,
                  height: `${((boundingBox[3] - boundingBox[1]) / 480) * 100}%`,
                }}
              >
                <span className="text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-1 py-0.5 rounded absolute -top-5 left-0">
                  {casingClassification?.label} ({(casingClassification?.confidence * 100).toFixed(0)}%)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Strip & OpenCV Preview */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-4">
        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {streamActive ? (
              <>
                <button
                  onClick={captureSnapshot}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>Freeze Snapshot</span>
                </button>
                <button
                  onClick={toggleFacingMode}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                  title="Toggle Front/Rear Camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={stopCamera}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs border border-slate-700"
                >
                  Stop Camera
                </button>
              </>
            ) : (
              <button
                onClick={startCamera}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Start Camera</span>
              </button>
            )}
          </div>

          {/* Trigger Scan Analysis */}
          <button
            onClick={executeAnalysis}
            disabled={!capturedImage || isProcessing}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-lg ${
              capturedImage && !isProcessing
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ScanText className="w-4 h-4" />
            <span>{isProcessing ? 'Analyzing Pipeline...' : 'Run Vision & OCR Pipeline'}</span>
          </button>
        </div>

        {/* Live Status String */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800">
          <span className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>STATUS: {statusMessage}</span>
          </span>
          {casingClassification && (
            <span className="text-cyan-400 font-semibold">
              Detected: {casingClassification.label}
            </span>
          )}
        </div>

        {/* Live OpenCV 5-Step Pipeline Preview Canvas */}
        {preprocessedPreview && (
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 font-semibold flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>OpenCV 5-Step Pipeline Result (Morphological Gradient & Otsu)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">CLAHE + Bilateral + Otsu</span>
            </div>
            <div className="h-28 bg-black rounded border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src={preprocessedPreview}
                alt="OpenCV Binarized Stamp"
                className="h-full object-contain filter contrast-125"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
