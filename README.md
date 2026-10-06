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
├── .streamlit/
│   └── config.toml                    # Streamlit executive light-theme configuration
├── backend/
│   ├── app/                           # Modular FastAPI application architecture
│   │   ├── core/                      # Environment settings & regulatory constants
│   │   ├── database/                  # SQLite models & database session
│   │   ├── routers/                   # REST endpoints (scan, diagnostic, batch, passport)
│   │   ├── schemas/                   # Pydantic schemas
│   │   ├── services/                  # Specialized computer vision & LCA services
│   │   └── main.py                    # Modular FastAPI root with demo seed
│   ├── samples/                       # Sample stamp datasets
│   ├── tests/                         # Pytest test suites (20 tests: OCR, BFR, LCA, API)
│   ├── main.py                        # Standalone FastAPI launcher & static file server
│   ├── pyproject.toml                 # Ruff & Pytest configuration
│   └── requirements.txt               # Backend Python dependencies
├── core/                              # Shared domain engines (Streamlit & Backend)
│   ├── bfr_engine.py                  # BFR hazard scoring & RoHS/POPs compliance
│   ├── lca_engine.py                  # ISO 14040 carbon offset & energy avoidance
│   ├── passport_generator.py          # ReportLab Digital Material Passport PDF builder
│   ├── polymer_kb.py                  # Polymer dictionary & appliance typologies
│   ├── thermal_calculator.py          # Extruder temperatures & FDM parameters
│   └── vision_engine.py               # 5-stage OpenCV contrast enhancement pipeline
├── docs/                              # Project documentation, research & presentation
│   ├── presentation/
│   │   └── polyloop_hackathon_pitch.pdf   # Hackathon competition slide deck
│   ├── prompts/
│   │   ├── polyloop_starter_prompt.docx   # Starter system prompt specifications
│   │   ├── polyloop_starter_prompt.pdf
│   │   └── polyloop_starter_prompt.txt
│   └── research/
│       ├── E-Waste_Plastic_Project_Blueprint.md   # Comprehensive technical blueprint
│       ├── E-Waste_Plastic_Project_Blueprint.pdf
│       └── E-Waste_Plastic_Project_Blueprint.txt
├── frontend/                          # Local web interfaces
│   ├── src/                           # React 18 + Vite + Tailwind component tree
│   ├── app.js                         # Standalone interactive client engine
│   ├── index.html                     # React / Vite entry point
│   ├── index_standalone.html          # Executive white-mode web interface
│   ├── style.css                      # White-mode design system & smooth animations
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── sample_images/                     # Curated studio-grade iFixit e-waste teardown photos
├── scripts/                           # Automation & data acquisition utilities
│   ├── download_ifixit_samples.py     # Curates studio teardowns from iFixit CDN
│   ├── download_real_samples.py       # Fetches open-source e-waste images from Wikimedia
│   └── generate_samples.py            # OpenCV synthetic mold stamp generator
├── app.py                             # Full-featured Streamlit web application
├── requirements.txt                   # Root Python dependencies
├── run_actual_site.bat                # Windows launcher for executive web app (port 8000)
├── run_polyloop.bat                   # Windows launcher for Streamlit app (port 8501)
├── README.md
└── .gitignore
```

---

## 4. Local Execution & Quickstart Guide

### Prerequisites
- Python 3.10+ (tested with Python 3.11 - 3.14)
- Node.js 18+ (optional, only for React Vite development)

### Option A: Streamlit Web Suite (White Mode with E-Waste Encyclopedia)
The Streamlit application features a full 6-module interactive workbench with in-app educational plastics and hazardous e-waste guides, 11 studio-grade iFixit samples, 5-stage OpenCV visualizer, sink-float diagnostic wizard, thermal calculators, LCA telemetry, and ReportLab PDF passport downloads:
```bash
# Launch directly via Windows batch file:
run_polyloop.bat

# Or run via Python CLI:
streamlit run app.py
```
- Streamlit Web Suite: `http://localhost:8501`

### Option B: Local Executive Web Application (White Mode + Smooth UI/UX Animations)
The standalone web interface is styled with a modern executive white-mode design system, fluid keyframe micro-animations (laser scan reticle, animated buoyancy tank, thermal pulse indicators), iFixit image gallery, and custom image upload support:
```bash
# Launch directly via Windows batch file:
run_actual_site.bat

# Or run via Python CLI:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- Executive Web Application: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### Option C: React 18 + Vite Development Server
```bash
cd frontend
npm install
npm run dev
```
- Vite Dev Server: `http://localhost:5173`

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
