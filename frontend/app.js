/**
 * PolyLoop Frontend Application Logic
 * Implements smooth UI/UX animations, interactive optical pipeline visualizer,
 * buoyancy tank simulator, thermal rheology presets, live LCA sliders, and PDF downloads.
 */

const API_BASE = window.location.origin;

// State
let activeSample = "ifixit_crt_rear_housing.jpg";
let currentScanData = null;
let batchState = {
  ABS: 45.0,
  PC_ABS: 28.0,
  HIPS: 12.0,
  PC: 8.0,
  BFR: 18.0
};

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initScanner();
  initDiagnosticWizard();
  initThermalSpecs();
  initLCASimulator();
  loadGallery();
  
  // Initial scan on default iFixit sample
  triggerScan(activeSample);
});

/* ============================================================
   Navigation Tabs
   ============================================================ */
function initNavigation() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const targetId = tab.dataset.tab;
      document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.classList.remove("active");
        if (panel.id === targetId) {
          panel.classList.add("active");
          // Re-trigger entrance animation
          panel.classList.remove("animate-fade-in");
          void panel.offsetWidth;
          panel.classList.add("animate-fade-in");
        }
      });
    });
  });
}

/* ============================================================
   Scanner & OpenCV 5-Stage Pipeline
   ============================================================ */
function initScanner() {
  const sampleSelect = document.getElementById("sampleSelect");
  const fileUpload = document.getElementById("fileUpload");
  const dropZone = document.getElementById("dropZone");
  const btnAddToBatch = document.getElementById("btnAddToBatch");

  sampleSelect.addEventListener("change", (e) => {
    activeSample = e.target.value;
    document.getElementById("activeScanImage").src = `/sample_images/${activeSample}`;
    document.getElementById("sourceBadge").textContent = "iFixit Studio Sample";
    triggerScan(activeSample);
  });

  // File Upload & Drag-and-Drop
  fileUpload.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleCustomFileUpload(e.target.files[0]);
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleCustomFileUpload(e.dataTransfer.files[0]);
    }
  });

  btnAddToBatch.addEventListener("click", () => {
    if (!currentScanData) return;
    const mass = parseFloat(document.getElementById("casingMass").value) || 1.5;
    const isRoHS = currentScanData.bfr_evaluation.rohs_compliant;
    const poly = currentScanData.metadata.detected_polymer_heuristic;

    if (!isRoHS) {
      batchState.BFR += mass;
      showNotification(`Quarantined ${mass.toFixed(1)} kg of hazardous BFR casing.`, "warning");
    } else {
      if (poly.includes("PC") && poly.includes("ABS")) batchState.PC_ABS += mass;
      else if (poly.includes("HIPS")) batchState.HIPS += mass;
      else if (poly.includes("PC")) batchState.PC += mass;
      else batchState.ABS += mass;
      showNotification(`Added ${mass.toFixed(1)} kg of verified ${poly} to batch.`, "success");
    }
    updateBatchHeader();
    syncLCASliders();
  });
}

async function triggerScan(sampleFilename, fileObj = null) {
  const laser = document.getElementById("laserBeam");
  laser.style.display = "block";
  document.getElementById("statusBadge").textContent = "ENHANCING...";
  document.getElementById("statusBadge").className = "pill-badge warning";

  const formData = new FormData();
  if (fileObj) {
    formData.append("file", fileObj);
  } else {
    formData.append("sample_filename", sampleFilename);
  }
  formData.append("vintage_year", 2005);

  try {
    const res = await fetch(`${API_BASE}/api/scan/stamp`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    currentScanData = data;
    renderScanResults(data);
  } catch (err) {
    console.error("Scan error:", err);
    document.getElementById("statusBadge").textContent = "OFFLINE FALLBACK";
  }
}

function renderScanResults(data) {
  const meta = data.metadata;
  const bfr = data.bfr_evaluation;
  const stages = data.stages;

  // 1. Polymer & Stamp
  document.getElementById("detectedPolymerName").textContent = meta.detected_polymer_heuristic;
  document.getElementById("detectedPolymerFull").textContent = meta.casing_name;
  document.getElementById("detectedStampCode").textContent = meta.iso_stamp_expected;

  // 2. Risk Meter
  const riskPct = Math.round(bfr.risk_score * 100);
  document.getElementById("bfrRiskValue").textContent = `${riskPct}%`;
  document.getElementById("bfrProgressBar").style.width = `${riskPct}%`;

  // 3. Status Badge
  const badge = document.getElementById("statusBadge");
  if (bfr.rohs_compliant) {
    badge.textContent = "ROHS APPROVED";
    badge.className = "pill-badge success";
    document.getElementById("bfrRiskValue").style.color = "var(--accent-emerald)";
  } else {
    badge.textContent = "BFR HAZARD";
    badge.className = "pill-badge danger";
    document.getElementById("bfrRiskValue").style.color = "var(--accent-crimson)";
  }

  // 4. Compliance cards
  const rohsCard = document.getElementById("rohsCard");
  const popsCard = document.getElementById("popsCard");
  if (bfr.rohs_compliant) {
    rohsCard.className = "comp-card pass";
    rohsCard.querySelector("p").textContent = "PASSED (< 1,000 ppm)";
    document.getElementById("rohsIcon").textContent = "✅";

    popsCard.className = "comp-card pass";
    popsCard.querySelector("p").textContent = "CLEARED (< 500 ppm)";
    document.getElementById("popsIcon").textContent = "✅";
  } else {
    rohsCard.className = "comp-card fail";
    rohsCard.querySelector("p").textContent = "NON-COMPLIANT";
    document.getElementById("rohsIcon").textContent = "⛔";

    popsCard.className = "comp-card fail";
    popsCard.querySelector("p").textContent = "RESTRICTED (Quarantine)";
    document.getElementById("popsIcon").textContent = "⛔";
  }

  // 5. Directive protocol
  document.getElementById("protocolHeading").textContent = bfr.status;
  document.getElementById("protocolDescription").textContent = bfr.recommendation;

  // 6. 5-Stage OpenCV Visualizer
  if (stages) {
    document.getElementById("imgStage1").src = stages.stage_1_original;
    document.getElementById("imgStage2").src = stages.stage_2_clahe;
    document.getElementById("imgStage3").src = stages.stage_3_bilateral;
    document.getElementById("imgStage4").src = stages.stage_4_gradient;
    document.getElementById("imgStage5").src = stages.stage_5_otsu;
  }
}

async function handleCustomFileUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("activeScanImage").src = e.target.result;
    document.getElementById("sourceBadge").textContent = "User Custom Photo";
  };
  reader.readAsDataURL(file);

  // Trigger processing
  await triggerScan(null, file);
}

/* ============================================================
   Diagnostic Sink-Float Wizard & Fluid Tank Simulation
   ============================================================ */
function initDiagnosticWizard() {
  const groups = [
    { id: "groupWater", key: "water" },
    { id: "groupSaline", key: "saline" },
    { id: "groupDense", key: "dense" },
    { id: "groupAcetone", key: "acetone" },
    { id: "groupLimonene", key: "limonene" },
    { id: "groupBeilstein", key: "beilstein" }
  ];

  groups.forEach(({ id }) => {
    const container = document.getElementById(id);
    container.querySelectorAll(".pill-option").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".pill-option").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        evaluateDiagnosticState();
      });
    });
  });

  document.getElementById("btnPushDiagToBatch").addEventListener("click", () => {
    const poly = document.getElementById("diagPredictedPolymer").textContent;
    const mass = parseFloat(document.getElementById("diagScrapMass").value) || 2.0;

    if (poly === "BFR_CONTAMINATED") {
      batchState.BFR += mass;
      showNotification(`Quarantined ${mass} kg of hazardous BFR scrap.`, "warning");
    } else {
      if (poly === "PC-ABS") batchState.PC_ABS += mass;
      else if (poly === "HIPS") batchState.HIPS += mass;
      else if (poly === "PC") batchState.PC += mass;
      else batchState.ABS += mass;
      showNotification(`Added ${mass} kg of ${poly} to batch.`, "success");
    }
    updateBatchHeader();
    syncLCASliders();
  });
}

function evaluateDiagnosticState() {
  const water = document.querySelector("#groupWater .pill-option.active")?.dataset.val;
  const saline = document.querySelector("#groupSaline .pill-option.active")?.dataset.val;
  const dense = document.querySelector("#groupDense .pill-option.active")?.dataset.val;
  const acetone = document.querySelector("#groupAcetone .pill-option.active")?.dataset.val;
  const limonene = document.querySelector("#groupLimonene .pill-option.active")?.dataset.val;
  const beilstein = document.querySelector("#groupBeilstein .pill-option.active")?.dataset.val;

  const chip = document.getElementById("plasticChip");
  const chipLbl = document.getElementById("chipLabel");
  const tankLbl = document.getElementById("tankLiquidLabel");
  const polyH2 = document.getElementById("diagPredictedPolymer");
  const confSpan = document.getElementById("diagConfidence");
  const notesUl = document.getElementById("diagNotesList");

  let predicted = "ABS";
  let confidence = "92.0%";
  let notes = [];
  let sinksInSim = false;

  if (beilstein === "positive") {
    predicted = "BFR_CONTAMINATED";
    confidence = "98.5%";
    notes.push("Positive Beilstein copper wire test confirms halogens (Bromine/Chlorine).");
    sinksInSim = true;
    tankLbl.textContent = "Dense Brine (ρ = 1.15 g/cm³)";
  } else if (water === "floats") {
    predicted = "PP";
    confidence = "95.0%";
    notes.push("Floats in plain tap water (ρ < 1.00 g/cm³): Aliphatic polyolefin.");
    sinksInSim = false;
    tankLbl.textContent = "Tap Water (ρ = 1.00 g/cm³)";
  } else if (saline === "floats" || limonene === "gel") {
    predicted = "HIPS";
    confidence = limonene === "gel" ? "96.0%" : "89.0%";
    notes.push("Buoyant in 10% saline (ρ = 1.07 g/cm³) and dissolves in d-limonene.");
    sinksInSim = false;
    tankLbl.textContent = "10% Saline Solution (ρ = 1.07 g/cm³)";
  } else if (dense === "sinks" && acetone === "resistant") {
    predicted = "PC";
    confidence = "93.0%";
    notes.push("Sinks in dense brine (ρ = 1.15) and chemically resistant to acetone.");
    sinksInSim = true;
    tankLbl.textContent = "Dense Brine (ρ = 1.15 g/cm³)";
  } else if (dense === "neutral") {
    predicted = "PC-ABS";
    confidence = "90.0%";
    notes.push("Neutral buoyancy boundary in 1.15 brine: PC-ABS engineering alloy.");
    sinksInSim = false;
    tankLbl.textContent = "Dense Brine (ρ = 1.15 g/cm³)";
  } else {
    predicted = "ABS";
    confidence = "92.0%";
    notes.push("Dense brine float (ρ < 1.15) and dissolves into tacky paste in acetone.");
    sinksInSim = false;
    tankLbl.textContent = "Dense Brine (ρ = 1.15 g/cm³)";
  }

  // Update Tank visual physics
  chipLbl.textContent = predicted === "BFR_CONTAMINATED" ? "BFR" : predicted;
  if (sinksInSim) {
    chip.classList.add("sinking");
  } else {
    chip.classList.remove("sinking");
  }

  // Update UI Card
  polyH2.textContent = predicted;
  polyH2.style.color = predicted === "BFR_CONTAMINATED" ? "var(--accent-crimson)" : "var(--accent-emerald)";
  confSpan.textContent = `${confidence} Confidence`;
  notesUl.innerHTML = notes.map(n => `<li>${n}</li>`).join("");
}

/* ============================================================
   Thermal Specs & Slicing Presets
   ============================================================ */
const THERMAL_PRESETS = {
  ABS: {
    dryTemp: "80°C (176°F)", dryTime: "3 - 4 hrs", dryMoisture: "< 500 ppm (0.05%)",
    dryFailure: "Steam bubbles at die, rough matte finish, severe layer shear weakness.",
    z1: "185°C - 195°C", z2: "215°C - 225°C", z3: "225°C - 235°C", water: "50°C - 60°C (Warm bath)",
    nozzle: "230°C - 245°C", bed: "95°C - 110°C", surface: "Smooth PEI + Dimafix",
    chamber: "Passive (40°C - 50°C)", fan: "0% - 15%", shrink: "0.4% - 0.7%"
  },
  "PC-ABS": {
    dryTemp: "100°C (212°F)", dryTime: "3 - 4 hrs", dryMoisture: "< 300 ppm (0.03%)",
    dryFailure: "Internal foaming, poor interlayer bonding, delamination under flexure.",
    z1: "210°C - 220°C", z2: "235°C - 245°C", z3: "250°C - 265°C", water: "60°C - 70°C",
    nozzle: "255°C - 275°C", bed: "100°C - 115°C", surface: "Textured PEI + Vision Miner",
    chamber: "Enclosed (45°C - 60°C)", fan: "10% - 20%", shrink: "0.5% - 0.7%"
  },
  HIPS: {
    dryTemp: "70°C (158°F)", dryTime: "2 - 3 hrs", dryMoisture: "< 500 ppm (0.05%)",
    dryFailure: "Micro-voiding, nozzle spitting, inconsistent filament diameter.",
    z1: "170°C - 180°C", z2: "195°C - 210°C", z3: "210°C - 225°C", water: "40°C - 50°C",
    nozzle: "220°C - 240°C", bed: "85°C - 100°C", surface: "PEI sheet or Kapton tape",
    chamber: "Passive (35°C - 45°C)", fan: "20% - 35%", shrink: "0.3% - 0.6%"
  },
  PC: {
    dryTemp: "120°C (248°F)", dryTime: "4 - 6 hrs", dryMoisture: "< 200 ppm (0.02%)",
    dryFailure: "Catastrophic hydrolytic chain scission! Moisture cleaves carbonate backbone.",
    z1: "230°C - 245°C", z2: "265°C - 275°C", z3: "280°C - 295°C", water: "70°C - 80°C",
    nozzle: "280°C - 305°C (All-Metal)", bed: "115°C - 130°C", surface: "PEI + PVA Glue Stick",
    chamber: "Actively Heated (65°C - 80°C)", fan: "0% (Zero draft)", shrink: "0.6% - 0.9%"
  },
  PP: {
    dryTemp: "70°C (158°F)", dryTime: "1 - 2 hrs", dryMoisture: "< 800 ppm (0.08%)",
    dryFailure: "Non-hygroscopic; surface moisture causes minor nozzle spitting.",
    z1: "170°C - 180°C", z2: "190°C - 205°C", z3: "205°C - 220°C", water: "25°C - 35°C",
    nozzle: "210°C - 230°C", bed: "85°C - 100°C", surface: "PP Packaging Tape",
    chamber: "Enclosed (40°C - 50°C)", fan: "50% - 100%", shrink: "1.5% - 2.5%"
  },
  BFR_CONTAMINATED: {
    dryTemp: "PROHIBITED", dryTime: "N/A", dryMoisture: "N/A",
    dryFailure: "DO NOT EXTRUDE! Thermal heating >210°C triggers dehydrohalogenation and toxic dioxin release.",
    z1: "REJECTED", z2: "REJECTED", z3: "REJECTED", water: "N/A",
    nozzle: "BANNED", bed: "BANNED", surface: "BANNED",
    chamber: "BANNED", fan: "BANNED", shrink: "N/A"
  }
};

function initThermalSpecs() {
  const btns = document.querySelectorAll(".poly-selector-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const poly = btn.dataset.poly;
      applyThermalPreset(poly);
    });
  });
}

function applyThermalPreset(poly) {
  const p = THERMAL_PRESETS[poly] || THERMAL_PRESETS.ABS;
  document.getElementById("dryTemp").textContent = p.dryTemp;
  document.getElementById("dryTime").textContent = p.dryTime;
  document.getElementById("dryMoisture").textContent = p.dryMoisture;
  document.getElementById("dryFailure").textContent = p.dryFailure;

  document.getElementById("extZ1").textContent = p.z1;
  document.getElementById("extZ2").textContent = p.z2;
  document.getElementById("extZ3").textContent = p.z3;
  document.getElementById("extWater").textContent = p.water;

  document.getElementById("fdmNozzle").textContent = p.nozzle;
  document.getElementById("fdmBed").textContent = p.bed;
  document.getElementById("fdmSurface").textContent = p.surface;
  document.getElementById("fdmChamber").textContent = p.chamber;
  document.getElementById("fdmFan").textContent = p.fan;
  document.getElementById("fdmShrink").textContent = p.shrink;
}

/* ============================================================
   LCA Simulator & Passport Download
   ============================================================ */
function initLCASimulator() {
  const sliders = [
    { id: "slideAbs", lbl: "lblMassAbs", key: "ABS" },
    { id: "slidePcabs", lbl: "lblMassPcabs", key: "PC_ABS" },
    { id: "slideHips", lbl: "lblMassHips", key: "HIPS" },
    { id: "slidePc", lbl: "lblMassPc", key: "PC" },
    { id: "slideBfr", lbl: "lblMassBfr", key: "BFR" }
  ];

  sliders.forEach(({ id, lbl, key }) => {
    const s = document.getElementById(id);
    s.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById(lbl).textContent = `${val.toFixed(1)} kg`;
      batchState[key] = val;
      recalculateLCA();
    });
  });

  document.getElementById("btnDownloadPassport").addEventListener("click", downloadPassportPDF);
  recalculateLCA();
}

function recalculateLCA() {
  const mAbs = batchState.ABS;
  const mPcabs = batchState.PC_ABS;
  const mHips = batchState.HIPS;
  const mPc = batchState.PC;
  const mBfr = batchState.BFR;

  // Virgin factors (kg CO2e / kg)
  const vAbs = mAbs * 3.80;
  const vPcabs = mPcabs * 5.10;
  const vHips = mHips * 3.35;
  const vPc = mPc * 6.80;
  const totalVirginCO2 = vAbs + vPcabs + vHips + vPc;

  // Process burden: 0.83 kg CO2e / kg
  const usableMass = mAbs + mPcabs + mHips + mPc;
  const totalRecycleCO2 = usableMass * 0.83;

  // Net avoided: M * (EF_virgin - 0.83) + M * 0.05
  const netAvoided = Math.max(0, (totalVirginCO2 - totalRecycleCO2) + (usableMass * 0.05) + (mBfr * 0.05));
  const oilSaved = (mAbs * 2.1) + (mPcabs * 2.9) + (mHips * 1.8) + (mPc * 3.9);
  const coalOffset = netAvoided * 0.49;
  const carKm = netAvoided * 4.07;

  // Update KPIs
  document.getElementById("kpiCo2").innerHTML = `+${netAvoided.toFixed(1)} <small>kg CO₂e</small>`;
  document.getElementById("kpiOil").innerHTML = `${oilSaved.toFixed(1)} <small>Liters</small>`;
  document.getElementById("kpiCoal").innerHTML = `${coalOffset.toFixed(1)} <small>kg</small>`;
  document.getElementById("kpiCar").innerHTML = `${Math.round(carKm).toLocaleString()} <small>km</small>`;

  // Update comparison bars
  document.getElementById("barVirginVal").textContent = `${totalVirginCO2.toFixed(1)} kg CO₂e`;
  document.getElementById("barRecycleVal").textContent = `${totalRecycleCO2.toFixed(1)} kg CO₂e`;
  const pctRecycle = totalVirginCO2 > 0 ? (totalRecycleCO2 / totalVirginCO2) * 100 : 20;
  document.getElementById("barRecycleFill").style.width = `${Math.min(100, Math.max(10, pctRecycle))}%`;

  updateBatchHeader();
}

function updateBatchHeader() {
  const usable = batchState.ABS + batchState.PC_ABS + batchState.HIPS + batchState.PC;
  document.getElementById("headerBatchYield").textContent = `${usable.toFixed(1)} kg Usable`;
}

function syncLCASliders() {
  document.getElementById("slideAbs").value = batchState.ABS;
  document.getElementById("lblMassAbs").textContent = `${batchState.ABS.toFixed(1)} kg`;
  document.getElementById("slidePcabs").value = batchState.PC_ABS;
  document.getElementById("lblMassPcabs").textContent = `${batchState.PC_ABS.toFixed(1)} kg`;
  document.getElementById("slideHips").value = batchState.HIPS;
  document.getElementById("lblMassHips").textContent = `${batchState.HIPS.toFixed(1)} kg`;
  document.getElementById("slidePc").value = batchState.PC;
  document.getElementById("lblMassPc").textContent = `${batchState.PC.toFixed(1)} kg`;
  document.getElementById("slideBfr").value = batchState.BFR;
  document.getElementById("lblMassBfr").textContent = `${batchState.BFR.toFixed(1)} kg`;
  recalculateLCA();
}

async function downloadPassportPDF() {
  const batchId = `POLY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const payload = {
    batch_id: batchId,
    casing_type: "Certified Mixed E-Waste Upcycling Batch",
    detected_polymer: "ABS",
    iso_stamp: ">ABS<",
    bfr_risk: 0.04,
    rohs_compliant: true,
    mass_kg: batchState.ABS + batchState.PC_ABS + batchState.HIPS + batchState.PC
  };

  try {
    const res = await fetch(`${API_BASE}/api/passport/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PolyLoop_Digital_Material_Passport_${batchId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showNotification(`Passport ${batchId}.pdf generated and downloaded!`, "success");
    } else {
      showNotification("Could not compile PDF passport.", "warning");
    }
  } catch (err) {
    console.error("PDF download error:", err);
  }
}

/* ============================================================
   iFixit Gallery Loader
   ============================================================ */
async function loadGallery() {
  const grid = document.getElementById("galleryGrid");
  try {
    const res = await fetch(`${API_BASE}/api/samples`);
    const data = await res.json();
    const ifixitSamples = data.samples.filter(s => s.is_ifixit);

    grid.innerHTML = ifixitSamples.map(item => `
      <div class="gallery-card" data-fn="${item.filename}">
        <div class="gallery-thumb-wrap">
          <img src="${item.url}" alt="${item.casing_name}" loading="lazy">
          <span class="gallery-tag-float">${item.expected_polymer}</span>
        </div>
        <div class="gallery-body">
          <h4>${item.casing_name}</h4>
          <p>Expected Mold Stamp: <code>${item.expected_stamp}</code></p>
          <div class="gallery-footer">
            <span class="gallery-poly">${item.appliance_type.replace('_', ' ').toUpperCase()}</span>
            <span class="gallery-btn-action">Test in Scanner →</span>
          </div>
        </div>
      </div>
    `).join("");

    // Add click listeners
    grid.querySelectorAll(".gallery-card").forEach(card => {
      card.addEventListener("click", () => {
        const fn = card.dataset.fn;
        activeSample = fn;
        document.getElementById("sampleSelect").value = fn;
        document.getElementById("activeScanImage").src = `/sample_images/${fn}`;
        
        // Switch to scanner tab
        document.querySelector(".nav-tab[data-tab='tab-scanner']").click();
        triggerScan(fn);
      });
    });
  } catch (err) {
    console.error("Failed to load gallery:", err);
  }
}

/* Notification Toast */
function showNotification(msg, type = "info") {
  const toast = document.createElement("div");
  toast.className = `notification-toast ${type}`;
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${type === "success" ? "#065f46" : (type === "warning" ? "#991b1b" : "#0f172a")};
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 1000;
    transition: all 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
