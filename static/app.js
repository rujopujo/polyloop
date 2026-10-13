/**
 * ReForm — E-Waste AI Triage Frontend Controller
 * Vanilla JavaScript (No external framework dependencies)
 */

document.addEventListener("DOMContentLoaded", () => {
  // ── State ────────────────────────────────────────────────────────────────
  const state = {
    facingMode1: "environment",
    facingMode2: "environment",
    stream1: null,
    stream2: null,
    file1: null,
    file2: null,
    step1Data: null,
    step2Data: null,
    activeView1: "overlay", // "overlay" or "original"
  };

  // ── DOM References ───────────────────────────────────────────────────────
  const refModal = document.getElementById("refModal");
  const btnHelpModal = document.getElementById("btnHelpModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingTitle = document.getElementById("loadingTitle");
  const loadingSubtitle = document.getElementById("loadingSubtitle");
  const toast = document.getElementById("toast");
  const statusLabel = document.getElementById("statusLabel");
  const statusPulse = document.getElementById("statusPulse");
  const btnInstallPwa = document.getElementById("btnInstallPwa");

  // Step 1 Elements
  const video1 = document.getElementById("video1");
  const canvas1 = document.getElementById("canvas1");
  const btnSnap1 = document.getElementById("btnSnap1");
  const btnSwitchCam1 = document.getElementById("btnSwitchCam1");
  const btnStartCam1 = document.getElementById("btnStartCam1");
  const camFallback1 = document.getElementById("camFallback1");
  const scannerLaser1 = document.getElementById("scannerLaser1");
  const dropzone1 = document.getElementById("dropzone1");
  const fileInput1 = document.getElementById("fileInput1");
  const dropPrompt1 = document.getElementById("dropPrompt1");
  const dropPreview1 = document.getElementById("dropPreview1");
  const previewImg1 = document.getElementById("previewImg1");
  const btnRemoveFile1 = document.getElementById("btnRemoveFile1");
  const btnAnalyzeUpload1 = document.getElementById("btnAnalyzeUpload1");

  // Step 1 Results
  const step1Results = document.getElementById("step1Results");
  const s0MaterialLabel = document.getElementById("s0MaterialLabel");
  const s0ConfBar = document.getElementById("s0ConfBar");
  const s0ConfValue = document.getElementById("s0ConfValue");
  const gradcamImg1 = document.getElementById("gradcamImg1");
  const nonplasticPanel = document.getElementById("nonplasticPanel");
  const plasticPanel = document.getElementById("plasticPanel");
  const batteryWarningBox = document.getElementById("batteryWarningBox");
  const batteryWarningText = document.getElementById("batteryWarningText");
  const npRecoveryRoute = document.getElementById("npRecoveryRoute");
  const npRecoveryDetail = document.getElementById("npRecoveryDetail");
  const npRecyclableNote = document.getElementById("npRecyclableNote");
  const npHazardsList = document.getElementById("npHazardsList");
  const npHandlingList = document.getElementById("npHandlingList");
  const npRegulationNote = document.getElementById("npRegulationNote");

  const s1ItemLabel = document.getElementById("s1ItemLabel");
  const s1ConfBar = document.getElementById("s1ConfBar");
  const s1ConfValue = document.getElementById("s1ConfValue");
  const bfrRiskBanner = document.getElementById("bfrRiskBanner");
  const bfrTitle = document.getElementById("bfrTitle");
  const bfrDescription = document.getElementById("bfrDescription");
  const estimatedPolymerCode = document.getElementById("estimatedPolymerCode");
  const plasticHandlingList = document.getElementById("plasticHandlingList");
  const plasticReuseList = document.getElementById("plasticReuseList");
  const plasticRegulationNote = document.getElementById("plasticRegulationNote");

  // Step 2 Elements
  const video2 = document.getElementById("video2");
  const canvas2 = document.getElementById("canvas2");
  const btnSnap2 = document.getElementById("btnSnap2");
  const btnSwitchCam2 = document.getElementById("btnSwitchCam2");
  const btnStartCam2 = document.getElementById("btnStartCam2");
  const camFallback2 = document.getElementById("camFallback2");
  const scannerLaser2 = document.getElementById("scannerLaser2");
  const dropzone2 = document.getElementById("dropzone2");
  const fileInput2 = document.getElementById("fileInput2");
  const dropPrompt2 = document.getElementById("dropPrompt2");
  const dropPreview2 = document.getElementById("dropPreview2");
  const previewImg2 = document.getElementById("previewImg2");
  const btnRemoveFile2 = document.getElementById("btnRemoveFile2");
  const btnAnalyzeUpload2 = document.getElementById("btnAnalyzeUpload2");

  // Step 2 Results
  const step2Results = document.getElementById("step2Results");
  const ocrResinCode = document.getElementById("ocrResinCode");
  const ocrConfidenceScore = document.getElementById("ocrConfidenceScore");
  const cvPreprocessedImg = document.getElementById("cvPreprocessedImg");
  const rawOcrTags = document.getElementById("rawOcrTags");
  const polymerPropertiesText = document.getElementById("polymerPropertiesText");

  // ── Toast Utility ────────────────────────────────────────────────────────
  function showToast(msg, duration = 3500) {
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, duration);
  }

  // ── Loading Overlay Utility ──────────────────────────────────────────────
  function showLoading(title, subtitle) {
    loadingTitle.textContent = title || "Analyzing…";
    loadingSubtitle.textContent = subtitle || "Processing image through neural pipeline";
    loadingOverlay.classList.remove("hidden");
  }

  function hideLoading() {
    loadingOverlay.classList.add("hidden");
  }

  // ── Check API Health ─────────────────────────────────────────────────────
  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        if (data.stage0_loaded && data.stage1_loaded) {
          statusLabel.textContent = "Models Active";
        } else if (data.stage0_loaded) {
          statusLabel.textContent = "Stage 0 Active";
        } else {
          statusLabel.textContent = "Models Missing";
          statusLabel.style.color = "#f87171";
        }
      }
    } catch {
      statusLabel.textContent = "Server Offline";
      statusLabel.style.color = "#f87171";
    }
  }
  checkHealth();

  // ── Tab Switching ────────────────────────────────────────────────────────
  document.querySelectorAll(".step-card").forEach((card) => {
    const tabBtns = card.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const tabTarget = btn.getAttribute("data-tab");

        if (tabTarget === "cam1") {
          document.getElementById("paneCam1").classList.add("active");
          document.getElementById("paneUpload1").classList.remove("active");
          startCamera1();
        } else if (tabTarget === "upload1") {
          document.getElementById("paneUpload1").classList.add("active");
          document.getElementById("paneCam1").classList.remove("active");
          stopCamera1();
        } else if (tabTarget === "cam2") {
          document.getElementById("paneCam2").classList.add("active");
          document.getElementById("paneUpload2").classList.remove("active");
          startCamera2();
        } else if (tabTarget === "upload2") {
          document.getElementById("paneUpload2").classList.add("active");
          document.getElementById("paneCam2").classList.remove("active");
          stopCamera2();
        }
      });
    });
  });

  // ── Camera 1 Setup ───────────────────────────────────────────────────────
  async function startCamera1() {
    stopCamera1();
    try {
      state.stream1 = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facingMode1, width: { ideal: 1280 } },
      });
      video1.srcObject = state.stream1;
      camFallback1.classList.remove("active");
    } catch (err) {
      console.warn("Camera 1 access error:", err);
      camFallback1.classList.add("active");
    }
  }

  function stopCamera1() {
    if (state.stream1) {
      state.stream1.getTracks().forEach((track) => track.stop());
      state.stream1 = null;
    }
  }

  btnStartCam1?.addEventListener("click", startCamera1);
  btnSwitchCam1?.addEventListener("click", () => {
    state.facingMode1 = state.facingMode1 === "environment" ? "user" : "environment";
    startCamera1();
  });

  // ── Camera 2 Setup ───────────────────────────────────────────────────────
  async function startCamera2() {
    stopCamera2();
    try {
      state.stream2 = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facingMode2, width: { ideal: 1280 } },
      });
      video2.srcObject = state.stream2;
      camFallback2.classList.remove("active");
    } catch (err) {
      console.warn("Camera 2 access error:", err);
      camFallback2.classList.add("active");
    }
  }

  function stopCamera2() {
    if (state.stream2) {
      state.stream2.getTracks().forEach((track) => track.stop());
      state.stream2 = null;
    }
  }

  btnStartCam2?.addEventListener("click", startCamera2);
  btnSwitchCam2?.addEventListener("click", () => {
    state.facingMode2 = state.facingMode2 === "environment" ? "user" : "environment";
    startCamera2();
  });

  // Initialize camera 1 on page load
  startCamera1();

  // ── Drag & Drop File Uploads ─────────────────────────────────────────────
  function setupDropzone(dropzone, fileInput, promptEl, previewEl, imgEl, removeBtn, analyzeBtn, stateFileKey) {
    dropzone.addEventListener("click", (e) => {
      if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
        fileInput.click();
      }
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFile(file);
      }
    });

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      state[stateFileKey] = null;
      fileInput.value = "";
      previewEl.classList.add("hidden");
      promptEl.classList.remove("hidden");
      analyzeBtn.disabled = true;
    });

    function handleFile(file) {
      state[stateFileKey] = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imgEl.src = e.target.result;
        promptEl.classList.add("hidden");
        previewEl.classList.remove("hidden");
        analyzeBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }
  }

  setupDropzone(dropzone1, fileInput1, dropPrompt1, dropPreview1, previewImg1, btnRemoveFile1, btnAnalyzeUpload1, "file1");
  setupDropzone(dropzone2, fileInput2, dropPrompt2, dropPreview2, previewImg2, btnRemoveFile2, btnAnalyzeUpload2, "file2");

  // ── Step 1 Inference Execution ───────────────────────────────────────────
  btnSnap1.addEventListener("click", () => {
    if (!video1.videoWidth) {
      showToast("Camera not ready. Wait a moment or upload a photo.");
      return;
    }
    canvas1.width = video1.videoWidth;
    canvas1.height = video1.videoHeight;
    const ctx = canvas1.getContext("2d");
    ctx.drawImage(video1, 0, 0, canvas1.width, canvas1.height);
    const dataUrl = canvas1.toDataURL("image/jpeg", 0.92);
    runStep1Analysis({ image_data: dataUrl });
  });

  btnAnalyzeUpload1.addEventListener("click", () => {
    if (!state.file1) return;
    runStep1Analysis({ file: state.file1 });
  });

  async function runStep1Analysis(payload) {
    showLoading("Classifying E-Waste Item", "Evaluating Stage 0 materials and Stage 1 plastic components…");
    scannerLaser1.classList.add("scanning");

    const formData = new FormData();
    if (payload.file) {
      formData.append("file", payload.file);
    } else if (payload.image_data) {
      formData.append("image_data", payload.image_data);
    }

    try {
      const res = await fetch("/api/step1-classify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }

      const data = await res.json();
      state.step1Data = data;
      renderStep1Results(data);
    } catch (err) {
      showToast(`Analysis failed: ${err.message}`);
    } finally {
      hideLoading();
      scannerLaser1.classList.remove("scanning");
    }
  }

  function renderStep1Results(data) {
    step1Results.classList.remove("hidden");

    // Stage 0 Display
    const s0 = data.stage0;
    s0MaterialLabel.textContent = s0.label.replace("_", " ");
    const s0Pct = (s0.confidence * 100).toFixed(1);
    s0ConfValue.textContent = `${s0Pct}%`;
    s0ConfBar.style.width = `${s0Pct}%`;

    // Explainability Image
    state.activeView1 = "overlay";
    updateGradcamView();

    // Check if below threshold
    if (data.below_threshold) {
      showToast(`Low confidence (${s0Pct}% < 70%). Better lighting recommended.`);
    }

    // Material routing
    if (!data.is_plastic) {
      plasticPanel.classList.add("hidden");
      nonplasticPanel.classList.remove("hidden");
      renderNonplasticDetails(data.nonplastic_route);
    } else {
      nonplasticPanel.classList.add("hidden");
      plasticPanel.classList.remove("hidden");
      renderPlasticDetails(data.stage1);

      // Smooth scroll to Step 2 to encourage resin code scanning
      setTimeout(() => {
        document.getElementById("step2Card").scrollIntoView({ behavior: "smooth", block: "start" });
      }, 700);
    }
  }

  function updateGradcamView() {
    if (!state.step1Data) return;
    if (state.activeView1 === "overlay") {
      // Use Stage 1 overlay if plastic and present, else Stage 0
      const overlay = state.step1Data.stage1?.gradcam_overlay || state.step1Data.stage0.gradcam_overlay;
      gradcamImg1.src = overlay;
    } else {
      gradcamImg1.src = state.step1Data.original_preview;
    }
  }

  // Grad-CAM View Toggle Buttons
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeView1 = btn.getAttribute("data-view");
      updateGradcamView();
    });
  });

  function renderNonplasticDetails(route) {
    if (!route) return;
    if (route.safety_warning) {
      batteryWarningBox.classList.remove("hidden");
      batteryWarningText.textContent = route.safety_warning;
    } else {
      batteryWarningBox.classList.add("hidden");
    }

    npRecoveryRoute.textContent = route.recovery_route;
    npRecoveryDetail.textContent = route.recovery_detail || "";
    npRecyclableNote.textContent = route.recyclable_note;

    npHazardsList.innerHTML = route.hazards.map((h) => `<li>${h}</li>`).join("");
    npHandlingList.innerHTML = route.handling_rules.map((r) => `<li>${r}</li>`).join("");
    npRegulationNote.textContent = `📋 Regulation Note: ${route.regulation_note}`;
  }

  function renderPlasticDetails(stage1) {
    if (!stage1) return;

    s1ItemLabel.textContent = stage1.label.replace("_", " ").toUpperCase();
    const s1Pct = (stage1.confidence * 100).toFixed(1);
    s1ConfValue.textContent = `${s1Pct}%`;
    s1ConfBar.style.width = `${s1Pct}%`;

    // BFR Risk Banner
    const risk = (stage1.bfr_risk || "unknown").toLowerCase();
    bfrRiskBanner.className = `bfr-banner bfr-risk-${risk}`;
    bfrTitle.textContent = `Brominated Flame Retardants (BFR): ${risk.toUpperCase()} RISK`;

    if (risk === "high" || risk === "very high") {
      bfrDescription.textContent = "High probability of halogenated flame retardants. Strictly avoid burning or heat processing. Direct to licensed recyclers equipped with thermal desorption.";
    } else if (risk === "medium") {
      bfrDescription.textContent = "Moderate BFR presence typical in internal housings. Use protective gloves during dismantling.";
    } else {
      bfrDescription.textContent = "Low expected BFR presence. Suitable for clean mechanical recycling and granulation.";
    }

    // Estimated polymer
    estimatedPolymerCode.textContent = stage1.typical_plastic;

    // Handling & Reuse
    plasticHandlingList.innerHTML = stage1.handling_rules.map((r) => `<li>${r}</li>`).join("");
    plasticReuseList.innerHTML = stage1.reuse_options.map((opt) => `<li>${opt}</li>`).join("");
    plasticRegulationNote.textContent = `📋 Regulation Note: ${stage1.regulation_note}`;
  }

  // ── Step 2 OCR Execution ─────────────────────────────────────────────────
  btnSnap2.addEventListener("click", () => {
    if (!video2.videoWidth) {
      showToast("Camera not ready. Wait a moment or upload a photo.");
      return;
    }
    canvas2.width = video2.videoWidth;
    canvas2.height = video2.videoHeight;
    const ctx = canvas2.getContext("2d");
    ctx.drawImage(video2, 0, 0, canvas2.width, canvas2.height);
    const dataUrl = canvas2.toDataURL("image/jpeg", 0.95);
    runStep2Ocr({ image_data: dataUrl });
  });

  btnAnalyzeUpload2.addEventListener("click", () => {
    if (!state.file2) return;
    runStep2Ocr({ file: state.file2 });
  });

  async function runStep2Ocr(payload) {
    showLoading("Reading Resin Code", "Enhancing contrast with CLAHE and running EasyOCR…");
    scannerLaser2.classList.add("scanning");

    const formData = new FormData();
    if (payload.file) {
      formData.append("file", payload.file);
    } else if (payload.image_data) {
      formData.append("image_data", payload.image_data);
    }

    try {
      const res = await fetch("/api/step2-ocr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }

      const data = await res.json();
      state.step2Data = data;
      renderStep2Results(data);
    } catch (err) {
      showToast(`OCR Scan failed: ${err.message}`);
    } finally {
      hideLoading();
      scannerLaser2.classList.remove("scanning");
    }
  }

  function renderStep2Results(data) {
    step2Results.classList.remove("hidden");

    // CV Pipeline Image
    cvPreprocessedImg.src = data.preprocessed_preview;

    // Matched Code
    if (data.success && data.matched_code) {
      ocrResinCode.textContent = data.matched_code;
      ocrConfidenceScore.textContent = `Fuzzy Match Score: ${data.fuzzy_score}% (Raw: "${data.raw_text_matched}")`;
      showToast(`Verified polymer: ${data.matched_code}`);

      // Update Step 1 Estimated Polymer badge if visible
      estimatedPolymerCode.textContent = `${data.matched_code} (OCR Confirmed)`;
    } else {
      ocrResinCode.textContent = "No Code Matched";
      ocrConfidenceScore.textContent = `Best guess: "${data.raw_text_matched || 'none'}" (${data.fuzzy_score}%) — Try closer/sharper shot`;
    }

    // Raw OCR Tags
    if (data.ocr_findings && data.ocr_findings.length > 0) {
      rawOcrTags.innerHTML = data.ocr_findings
        .map((f) => `<span class="ocr-tag">${f.text} (${Math.round(f.confidence * 100)}%)</span>`)
        .join("");
    } else {
      rawOcrTags.innerHTML = `<span class="ocr-tag">No text tokens found</span>`;
    }

    // Polymer properties text
    if (data.plastic_info && data.plastic_info.notes) {
      polymerPropertiesText.textContent = data.plastic_info.notes;
    } else {
      polymerPropertiesText.textContent = "Polymer properties will be displayed upon matching standard ISO 11469 codes.";
    }
  }

  // ── Regulations Modal ────────────────────────────────────────────────────
  btnHelpModal.addEventListener("click", () => {
    refModal.classList.remove("hidden");
  });

  btnCloseModal.addEventListener("click", () => {
    refModal.classList.add("hidden");
  });

  refModal.addEventListener("click", (e) => {
    if (e.target === refModal) {
      refModal.classList.add("hidden");
    }
  });

  // ── Progressive Web App (PWA) Controller ────────────────────────────────
  let deferredPrompt = null;

  // Listen for beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstallPwa) {
      btnInstallPwa.classList.remove("hidden");
    }
  });

  if (btnInstallPwa) {
    btnInstallPwa.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      btnInstallPwa.classList.add("hidden");
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        showToast("ReForm installed to device!");
      }
      deferredPrompt = null;
    });
  }

  window.addEventListener("appinstalled", () => {
    if (btnInstallPwa) btnInstallPwa.classList.add("hidden");
    showToast("ReForm is running as an installed PWA.");
  });

  // Online / Offline Connectivity Monitor
  function updateNetworkStatus() {
    if (navigator.onLine) {
      if (statusPulse) statusPulse.classList.remove("offline");
      if (statusLabel) statusLabel.textContent = "Models Online";
    } else {
      if (statusPulse) statusPulse.classList.add("offline");
      if (statusLabel) statusLabel.textContent = "Offline Mode";
      showToast("Network offline. UI shell active, inference paused.");
    }
  }

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);

  // Register Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[PWA] Service Worker active with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    });
  }
});
