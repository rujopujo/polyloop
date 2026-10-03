# PolyLoop: Zero-Cost E-Waste Plastic Identification, BFR Screening & Upcycling System

[![PolyLoop CI](https://github.com/rujopujo/polyloop/actions/workflows/ci.yml/badge.svg)](https://github.com/rujopujo/polyloop/actions)
[![Python 3.11](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

An end-to-end, zero-cost, locally executable software pipeline for automated e-waste casing identification, brominated flame retardant (BFR) hazard screening, single-screw 3D printing filament thermal calculation, and verifiable Digital Material Passport generation.

---

## 1. Executive Summary & Scientific Foundations

Polymeric housings account for **20% to 30% of global electronic waste volume**, yet **over 80% is landfilled or incinerated**. This systemic leakage stems from two physical bottlenecks:

1. **Thermodynamic Polymer Incompatibility ($\chi_{12} > 0$):** Commingling polar Acrylonitrile Butadiene Styrene (ABS) with non-polar High-Impact Polystyrene (HIPS) causes severe micro-phase separation and **over 70% loss in tensile elongation and notched Izod impact resistance**.
2. **Hazardous Brominated Flame Retardants (BFRs):** Legacy additives (DecaBDE, OctaBDE, TBBPA with Antimony Trioxide $Sb_2O_3$) release toxic polybrominated dibenzo-p-dioxins and furans (PBDD/Fs) when remelted above 210°C. International directives (**EU RoHS 2011/65/EU**, **EU POPs 2019/1021**, and **WEEE Annex VII**) cap PBDEs at 500–1,000 ppm.

PolyLoop replaces **$30,000 NIR/XRF industrial spectrometers** with a **100% free open-source software stack**:
- **Computer Vision (YOLOv8n):** Identifies appliance typology and historical manufacturing era.
- **Mold Stamp Relief OCR (OpenCV + EasyOCR):** 5-step contrast enhancement pipeline (`Grayscale` $\rightarrow$ `CLAHE` $\rightarrow$ `Bilateral Filter` $\rightarrow$ `Morphological Gradient` $\rightarrow$ `Otsu Binarization`) parsing ISO 11469 / ISO 1043 codes (`>ABS<`, `>PS-HI<`, `>PC+ABS<`, `>ABS-FR(40)<`).
- **Benchtop Diagnostic Wizard:** Dynamic sink-float stratification (pure tap water $\rho=1.00$, 10% NaCl $\rho=1.07$, dense brine $\rho=1.15$), acetone/d-limonene solvation, and copper wire Beilstein flame tests.
- **Thermal Rheology & Slicing Engine:** 3-zone extruder temperatures (170°C–295°C), hygroscopic pre-drying regimes (<200–500 ppm), and FDM 3D printing settings.
- **ISO 14040/14044 Life Cycle Assessment (LCA):** Calculates net carbon avoidance ($\Delta E_{\text{avoided}} = +3.02\text{ kg CO}_2\text{e/kg}$ for ABS, $+6.02\text{ kg CO}_2\text{e/kg}$ for PC) and compiles downloadable ReportLab PDF Material Passports.

---

## 2. 100% Free Open-Source Architecture

| Layer | Technology | License | Zero-Cost Justification |
| :--- | :--- | :--- | :--- |
| **Object Classification** | Ultralytics YOLOv8n | AGPL-3.0 | Local CPU/GPU inference without cloud vision API fees. |
| **Image Preprocessing** | OpenCV (`opencv-python-headless`) | Apache 2.0 | High-performance CLAHE, bilateral filtering, and gradient binarization. |
| **Character Recognition** | EasyOCR + PyTorch | Apache 2.0 | Embedded OCR engine with ISO 11469 regular expression extraction. |
| **Backend API** | FastAPI + Pydantic v2 | MIT | Asynchronous Python server with automatic OpenAPI documentation. |
| **Local Database** | SQLite + SQLAlchemy | Public Domain | Serverless, zero-configuration local relational database. |
| **Frontend HUD** | React 18 + Vite + Tailwind CSS | MIT | Fast compilation, dark-mode industrial theme, WebRTC camera feed. |
| **Data Visualization** | Recharts | MIT | Component-based SVG charts for LCA telemetry and batch breakdowns. |
| **Passport Generator** | ReportLab Document Engine | BSD | Programmatic PDF compilation with SHA-256 verification stamps. |

---

## 3. Repository Directory Structure

```text
polyloop/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions (Pytest, Ruff, Vite build)
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              # Environment settings & storage paths
│   │   │   └── constants.py           # Regulatory limits, ISO codes, LCA constants
│   │   ├── database/
│   │   │   ├── models.py              # ScanRecord, BatchRecord, BatchItem
│   │   │   └── session.py             # SQLite session management
│   │   ├── schemas/
│   │   │   ├── scan.py                # Pydantic scan & diagnostic models
│   │   │   ├── polymer.py             # Polymer Knowledge Base schemas
│   │   │   └── batch.py               # Batch aggregation & LCA schemas
│   │   ├── services/
│   │   │   ├── vision_service.py      # YOLOv8n classifier + heuristic fallback
│   │   │   ├── ocr_service.py         # OpenCV 5-step pipeline + EasyOCR
│   │   │   ├── polymer_kb.py          # Domain knowledge dictionary
│   │   │   ├── bfr_engine.py          # RoHS/POPs compliance & BFR hazard scoring
│   │   │   ├── thermal_calculator.py  # 3-zone extruder & FDM parameters
│   │   │   ├── lca_engine.py          # ISO 14040 carbon offset mathematics
│   │   │   └── passport_pdf.py        # ReportLab PDF passport generator
│   │   ├── routers/
│   │   │   ├── scan.py                # POST /api/scan/casing, POST /api/scan/stamp
│   │   │   ├── diagnostic.py          # POST /api/diagnostic/wizard
│   │   │   ├── batch.py               # POST /api/batches, GET /api/batches/{id}/metrics
│   │   │   └── passport.py            # GET /api/passport/{id}/pdf, GET /api/kb/polymers
│   │   └── main.py                    # FastAPI root with demo seed
│   ├── samples/
│   │   ├── generate_samples.py        # OpenCV synthetic stamp image generator
│   │   └── test_stamps/               # Synthesized test stamps (>ABS<, >PC+ABS<, etc.)
│   ├── requirements.txt               # Free & open-source Python dependencies
│   ├── pyproject.toml                 # Ruff & Pytest configuration
│   └── tests/
│       ├── test_ocr.py                # ISO 11469 regex parser validation
│       ├── test_bfr.py                # RoHS rejection & CRT hazard testing
│       ├── test_lca.py                # Carbon offset equations validation
│       └── test_api.py                # FastAPI endpoint response testing
├── frontend/
│   ├── index.html
│   ├── package.json                   # React 18, Vite, Tailwind CSS, Recharts
│   ├── vite.config.js                 # Dev server with backend proxy
│   ├── tailwind.config.js             # Industrial dark palette tokens
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx             # System branding & status indicator
│       │   ├── CameraHUD.jsx          # WebRTC feed, OpenCV canvas, sample picker
│       │   ├── ScanResultsCard.jsx    # Verification badges & BFR risk gauge
│       │   ├── DiagnosticWizard.jsx   # 5-step sink-float decision tree
│       │   ├── ThermalSpecsCard.jsx   # 3-zone extruder graphic & drying gauges
│       │   ├── LCAMetricsCard.jsx     # Recharts carbon footprint & composition charts
│       │   ├── BatchManager.jsx       # Batch aggregation & scan queue
│       │   └── PassportModal.jsx      # Digital Material Passport viewer & PDF trigger
│       ├── services/
│       │   └── api.js                 # API client with resilient fallbacks
│       ├── utils/
│       │   └── formatting.js          # Unit formatters & color maps
│       ├── App.jsx                    # Top tab shell & shared state
│       ├── index.css                  # Dark mode industrial styling
│       └── main.jsx
├── .gitignore
└── README.md
```

---

## 4. Local Execution & Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Run Backend Server
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/api/health`

### 2. Run Frontend Web Application
```bash
# Open a new terminal in the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 5. Automated Testing & Quality Gates

Run automated backend unit tests:
```bash
cd backend
python -m pytest tests/
```

Run code formatting and linting:
```bash
cd backend
ruff check .
```

Verify frontend production build:
```bash
cd frontend
npm run build
```

---

## 6. Mathematical Formulas

### Life Cycle Assessment (LCA) GWP Avoidance (ISO 14040 / 14044)
$$\Delta E_{\text{avoided}} = M_{\text{recycled}} \cdot (EF_{\text{virgin}} - EF_{\text{recycling}}) + M_{\text{diverted}} \cdot EF_{\text{landfill\_credit}} - M_{\text{recycled}} \cdot EF_{\text{transp}}$$

- $EF_{\text{recycling}} = 0.75\text{ kg CO}_2\text{e/kg}$
- $EF_{\text{landfill\_credit}} = 0.05\text{ kg CO}_2\text{e/kg}$
- $EF_{\text{transp}} = 0.08\text{ kg CO}_2\text{e/kg}$
- Total Process Burden = $0.78\text{ kg CO}_2\text{e/kg}$

**Net Avoidance Factors:**
- **ABS:** $+3.02\text{ kg CO}_2\text{e/kg}$ (~2.1 L crude oil)
- **HIPS:** $+2.57\text{ kg CO}_2\text{e/kg}$ (~1.8 L crude oil)
- **PC:** $+6.02\text{ kg CO}_2\text{e/kg}$ (~3.9 L crude oil)
- **PC-ABS:** $+4.32\text{ kg CO}_2\text{e/kg}$ (~2.9 L crude oil)
- **Coal Equivalent:** $1\text{ kg CO}_2\text{e} \approx 0.49\text{ kg bituminous coal}$
