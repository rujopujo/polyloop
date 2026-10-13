# ♻️ ReForm — E-Waste Plastic Identification and Upcycling System

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![PWA](https://img.shields.io/badge/PWA-Ready-10B981?style=flat-square&logo=pwa&logoColor=white)](static/manifest.webmanifest)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**ReForm** is an end-to-end AI-powered e-waste identification, material classification, and polymer upcycling platform. Built with a dual-stage transfer-learning pipeline (MobileNetV2), EasyOCR resin code parsing, and Grad-CAM explainability, it helps recyclers and makers identify polymers, detect hazardous brominated flame retardants (BFR), route non-plastic e-waste, and adhere to **India's E-Waste (Management) Rules 2022**.

---

## 🌟 Highlights

- ⚡ **Dual Frontend Experience**:
  - **Modern Full-Stack Web Application** (`server.py` + `static/`): Ultra-fast FastAPI backend with a responsive vanilla CSS/JS glassmorphic HUD, real-time camera scanning, and interactive Grad-CAM heatmap inspection.
  - **Streamlit Analytics Dashboard** (`app.py`): Rapid prototyping interface for exploration and data science analysis.
- 📱 **Progressive Web App (PWA) & Offline Shell**:
  - Installable directly to mobile home screens and desktops (`static/manifest.webmanifest`, high-res icons).
  - Service Worker (`static/sw.js`) with cache-first asset strategy and live online/offline connectivity indicator.
- 🌐 **1-Click Remote HTTPS & Cloudflare Tunnel**:
  - Automated launcher scripts (`start_tunnel.bat` & `start_tunnel.ps1`) spin up the FastAPI backend and a secure Cloudflare Tunnel (`trycloudflare.com`) with zero port forwarding, enabling real-time mobile camera scanning on any smartphone or tablet. Detailed in [PWA_CLOUDFLARE_GUIDE.md](PWA_CLOUDFLARE_GUIDE.md).
- 🎯 **Two-Stage Machine Learning Pipeline**:
  - **Stage 0 (Material Sorter)**: Classifies general material into `plastic`, `metal`, `PCB`, `glass_screen`, `battery`, or `unknown`.
  - **Stage 1 (Item Classifier)**: If plastic, classifies casing into `keyboard`, `mouse`, `printer_casing`, `tv_panel`, `remote`, `other_plastic`, or `unknown`.
- 🔍 **Resin Code OCR Scanner (ISO 11469)**: EasyOCR with OpenCV image enhancement (CLAHE, bilateral filtering, thresholding) and fuzzy matching (`thefuzz`) to detect moulded resin stamps (`>ABS<`, `>PC+ABS<`, `>PP<`, etc.).
- 🧠 **Explainable AI (Grad-CAM)**: Heatmaps overlay predicted visual attention zones so users understand why the model made each classification.
- 🛠️ **CLI Dataset Ingestion & Training Suite**:
  - `add_images.py`: Ingests and validates photos with automatic 70% train / 15% val / 15% test splitting.
  - `train_models.py`: Dual-stage MobileNetV2 transfer learning trainer with frozen-head warmup and fine-tuning epochs.
- 📦 **Pre-trained Production Models Bundled**: Production weights (`models/stage0_model.keras` & `models/stage1_model.keras`) included out of the box with cross-platform loading support.
- 🐳 **Docker & Cloud Deployment Ready**: Containerized deployment for 1-click cloud hosting on Hugging Face Spaces (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)).

---

## 🏗️ Architecture Pipeline

```text
Step 1: Item Photo
    │
    ▼
Stage 0: MobileNetV2 Material Sorter (6 classes, 70% threshold)
    ├─► non-plastic (metal, PCB, glass, battery) ──► nonplastic_routes.json
    │                                                (Recovery routing, precious metals, hazards)
    ▼ predicts plastic
Stage 1: MobileNetV2 Item Classifier (7 classes)
    │
    ▼
Step 2: Close-up Resin Code Photo (Optional)
    │   EasyOCR + CLAHE/Otsu Preprocessing + Fuzzy String Matching
    │   (Matches: >ABS<, >PC+ABS<, >PC<, >HIPS<, >PP<, >PVC<, >PE<, etc.)
    ▼
Comprehensive Upcycling & Compliance Report
    ├── Confirmed polymer classification
    ├── BFR (Brominated Flame Retardant) risk rating & hazards
    ├── Safe handling procedures & recycling instructions
    └── India's E-Waste (Management) Rules 2022 EPR compliance note
```

---

## 🔍 Classification Taxonomy

### Stage 0 — Materials (6 Classes)
`plastic` · `metal` · `PCB` · `glass_screen` · `battery` · `unknown`

### Stage 1 — Plastic Items (7 Classes)
`keyboard` · `mouse` · `printer_casing` · `tv_panel` · `remote` · `other_plastic` · `unknown`

### Step 2 — Supported Resin Codes (ISO 11469)
`>ABS<` · `>PC+ABS<` · `>PC<` · `>PS<` · `>HIPS<` · `>PP<` · `>PVC<` · `>PE<` · `>HDPE<` · `>LDPE<` · `>PET<` · `>ABS+PC<`

---

## 🚀 Quickstart

### Prerequisites
- Python 3.11+
- *(Optional)* NVIDIA GPU with CUDA for accelerated training/inference

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/rujopujo/reform.git
cd reform

# Create virtual environment
python -m venv .venv

# Activate environment (Windows PowerShell)
.venv\Scripts\Activate.ps1
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Launch the Application

#### Option A: FastAPI Modern Web Application (Recommended)
```bash
python -m uvicorn server:app --host 127.0.0.1 --port 7860 --reload
```
Open [http://127.0.0.1:7860](http://127.0.0.1:7860) in your browser.

#### Option B: 1-Click PWA & Cloudflare Tunnel (Mobile Camera Testing)
Instantly exposes ReForm over a secure HTTPS URL for smartphones and tablets:
- **Windows Command Prompt**:
  ```bat
  start_tunnel.bat
  ```
- **PowerShell**:
  ```powershell
  .\start_tunnel.ps1
  ```
See [PWA_CLOUDFLARE_GUIDE.md](PWA_CLOUDFLARE_GUIDE.md) for full instructions on installing ReForm as an app on iOS and Android.

#### Option C: Streamlit Dashboard
```bash
streamlit run app.py
```
Open [http://localhost:8501](http://localhost:8501) in your browser.

---

## 🐳 Docker & Cloud Deployment

ReForm is fully containerized and configured for deployment on **Hugging Face Spaces (Docker Free Tier: 2 vCPU, 16 GB RAM)**:

```bash
# Build Docker image locally
docker build -t reform-ai .

# Run container
docker run -p 7860:7860 reform-ai
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step instructions on deploying online for free.

---

## 📡 REST API Documentation

When running `server.py`, FastAPI exposes an interactive OpenAPI documentation page at `/docs`.

| Endpoint | Method | Description |
|---|---|---|
| `GET /` | `GET` | Serves the main web application UI (`static/index.html`) |
| `GET /manifest.webmanifest` | `GET` | Progressive Web App manifest specification |
| `GET /sw.js` | `GET` | Service Worker script for offline asset caching |
| `GET /api/health` | `GET` | Health check, device configuration, and loaded model status |
| `POST /api/step1-classify` | `POST` | Dual-stage material & item inference + Grad-CAM heatmap generation |
| `POST /api/step2-ocr` | `POST` | EasyOCR resin stamp detection + ISO 11469 fuzzy matching + polymer lookup |

---

## 🧠 Model Training & Dataset Preparation

### 1. Ingest New Images
Quickly add images to the dataset with automatic 70% train / 15% val / 15% test splitting:
```bash
# Ingest new device images into Stage 1
python add_images.py --source "C:/path/to/my_keyboards" --device "keyboard"

# Check dataset balance & distribution
python add_images.py --status
```

### 2. Train Models via CLI
Train MobileNetV2 models headlessly with 2-phase transfer learning (frozen feature extractor followed by fine-tuning):
```bash
# Train Stage 1 (Plastic Item Classifier)
python train_models.py --stage 1

# Train Stage 0 (Material Sorter)
python train_models.py --stage 0

# Train both stages sequentially
python train_models.py --stage all
```

### 3. Interactive Notebook
Explore model comparison benchmarks across MobileNetV2, EfficientNetB0, and MobileNetV3Large in `train.ipynb`:
```bash
jupyter notebook train.ipynb
```
Benchmark comparison results are saved in [models/model_comparison.json](models/model_comparison.json).

---

## 📁 Repository Structure

```text
ReForm/
├── server.py                   # FastAPI backend & REST API endpoints
├── app.py                      # Streamlit dashboard interface
├── static/                     # Full-stack web frontend assets
│   ├── index.html              # Modern glassmorphism HTML5 UI
│   ├── style.css               # Responsive design, animations & PWA styles
│   ├── app.js                  # Frontend state machine, camera, & PWA controller
│   ├── manifest.webmanifest    # Progressive Web App manifest
│   ├── sw.js                   # Service Worker for offline asset caching
│   └── icons/                  # PWA app icons (192, 512, maskable, favicon)
├── start_tunnel.bat            # 1-Click launcher for Windows CMD (FastAPI + Tunnel)
├── start_tunnel.ps1            # 1-Click launcher for PowerShell (FastAPI + Tunnel)
├── PWA_CLOUDFLARE_GUIDE.md     # Mobile PWA installation & Cloudflare guide
├── DEPLOYMENT_GUIDE.md         # Free cloud hosting guide (Hugging Face Spaces)
├── add_images.py               # Dataset ingestion & 70/15/15 auto-splitter CLI
├── train_models.py             # Headless MobileNetV2 transfer learning trainer
├── train.ipynb                 # Interactive Jupyter training & evaluation notebook
├── gradcam.py                  # Grad-CAM heatmap generation & visualization
├── models/                     # Pre-trained production weights & label maps
│   ├── stage0_model.keras      # Stage 0 Material Sorter (~21.8 MB)
│   ├── stage0_classes.json     # Stage 0 class index mapping
│   ├── stage1_model.keras      # Stage 1 Plastic Item Classifier (~21.8 MB)
│   ├── stage1_classes.json     # Stage 1 class index mapping
│   └── model_comparison.json  # Benchmark metrics across backbones
├── knowledge_base.json         # Polymer properties, BFR hazards & EPR compliance rules
├── nonplastic_routes.json      # Recovery pathways for metals, PCBs, glass, batteries
├── requirements.txt            # Python dependencies
├── packages.txt                # Linux system dependencies for cloud deployment
├── Dockerfile                  # Container definition for Docker & Hugging Face
└── README.md                   # Project documentation
```

---

## 📋 Compliance & Legal Disclaimer

Hazard warnings and regulatory citations reference **India's E-Waste (Management) Rules 2022** and international Extended Producer Responsibility (EPR) guidelines. All output is intended for advisory guidance; always verify with local municipal regulations and certified e-waste recyclers before processing hazardous components.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
