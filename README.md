# ♻️ ReForm — E-Waste Plastic Identification and Upcycling System

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**ReForm** is an end-to-end AI-powered e-waste identification, material classification, and polymer upcycling platform. Built with a dual-stage transfer-learning pipeline (MobileNetV2), EasyOCR resin code parsing, and Grad-CAM explainability, it helps recyclers and makers identify polymers, detect hazardous brominated flame retardants (BFR), route non-plastic e-waste, and adhere to **India's E-Waste (Management) Rules 2022**.

---

## 🌟 Highlights

- ⚡ **Dual Frontend Experience**:
  - **Modern Full-Stack Web Application** (`server.py` + `static/`): Ultra-fast FastAPI backend with a responsive vanilla CSS/JS glassmorphic HUD, real-time camera scanning, and interactive Grad-CAM heatmap inspection.
  - **Streamlit Analytics Dashboard** (`app.py`): Rapid prototyping interface for exploration and data science analysis.
- 🎯 **Two-Stage Machine Learning Pipeline**:
  - **Stage 0 (Material Sorter)**: Classifies general material into `plastic`, `metal`, `PCB`, `glass_screen`, `battery`, or `unknown`.
  - **Stage 1 (Item Classifier)**: If plastic, classifies the casing into `keyboard`, `mouse`, `printer_casing`, `tv_panel`, `remote`, `other_plastic`, or `unknown`.
- 🔍 **Resin Code OCR Scanner (ISO 11469)**: EasyOCR with OpenCV image enhancement (CLAHE, bilateral filtering, thresholding) and fuzzy matching (`thefuzz`) to detect moulded resin stamps (`>ABS<`, `>PC+ABS<`, `>PP<`, etc.).
- 🧠 **Explainable AI (Grad-CAM)**: Heatmaps overlay predicted visual attention zones so users understand why the model made each classification.
- 📦 **Pre-trained Models Bundled**: Production weights (`models/stage0_model.keras` & `models/stage1_model.keras`) included out of the box.
- 🐳 **Docker & Hugging Face Spaces Ready**: Containerized deployment for 1-click cloud hosting with zero cost (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)).

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
- *(Optional)* NVIDIA GPU with CUDA 11.8 for accelerated training/inference

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/rujopujo/polyloop.git reform
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

#### Option B: Streamlit Dashboard
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
| `GET /` | `GET` | Serves the main web application UI |
| `GET /health` | `GET` | Health check & model status |
| `POST /predict/stage0` | `POST` | Material classification + Grad-CAM heatmap |
| `POST /predict/stage1` | `POST` | Plastic item classification + Grad-CAM heatmap |
| `POST /ocr/resin-code` | `POST` | EasyOCR resin stamp detection & fuzzy matching |
| `GET /knowledge-base` | `GET` | Knowledge base entries for polymers and EPR rules |
| `GET /nonplastic-routes` | `GET` | Recycling routes for non-plastic materials |

---

## 🧠 Model Training & Dataset Preparation

Model training scripts and transfer learning pipelines are provided in `train.ipynb`:

```bash
jupyter notebook train.ipynb
```

- **Backbones**: MobileNetV2 (primary), EfficientNetB0, MobileNetV3Large
- **Strategy**: Two-phase transfer learning (frozen feature extractor $\rightarrow$ unfreezing top layers with low learning rate `1e-5`)
- **Dataset tools**: `download_datasets.py` and `organise_dataset.py` format Roboflow e-waste datasets into 70/15/15 train/val/test splits.
- Benchmark comparison table is saved in [models/model_comparison.json](models/model_comparison.json).

---

## 📁 Repository Structure

```text
ReForm/
├── server.py               # FastAPI application backend & REST endpoints
├── static/                 # Full-stack web frontend assets
│   ├── index.html          # Semantic HTML5 UI layout
│   ├── style.css           # Modern glassmorphism & responsive styles
│   └── app.js              # Client-side camera, scanning, and API integration
├── app.py                  # Streamlit dashboard interface
├── gradcam.py              # Grad-CAM heatmap extraction and blending
├── models/                 # Pre-trained models and class label maps
│   ├── stage0_model.keras  # Stage 0 material sorter model (~21.8 MB)
│   ├── stage0_classes.json # Stage 0 class index mapping
│   ├── stage1_model.keras  # Stage 1 plastic item model (~21.8 MB)
│   ├── stage1_classes.json # Stage 1 class index mapping
│   └── model_comparison.json
├── knowledge_base.json     # Polymer hazard, BFR, handling, & reuse guidelines
├── nonplastic_routes.json  # Recovery pathways for metals, PCBs, glass, batteries
├── requirements.txt        # Production Python dependencies
├── Dockerfile              # Docker container definition
├── .dockerignore           # Docker build exclusions
├── DEPLOYMENT_GUIDE.md     # Hugging Face Spaces deployment guide
├── train.ipynb             # Jupyter training notebook
├── download_datasets.py    # Dataset downloading script
├── organise_dataset.py     # Class mapping & dataset preparation
├── check_env.py            # Environment & GPU verification script
└── README.md               # Project documentation
```

---

## 📋 Compliance & Legal Disclaimer

Hazard warnings and regulatory citations reference **India's E-Waste (Management) Rules 2022** and international Extended Producer Responsibility (EPR) guidelines. All output is intended for advisory guidance; always verify with local municipal regulations and certified e-waste recyclers before processing hazardous components.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
