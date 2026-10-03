# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PolyLoop is a zero-cost e-waste plastic identification and upcycling system that replaces expensive industrial spectrometers with open-source computer vision. The system identifies polymers (ABS, HIPS, PC, PC-ABS) from e-waste casings, screens for hazardous brominated flame retardants (BFRs), calculates thermal extrusion parameters for 3D printing filament, performs ISO 14040/14044 Life Cycle Assessment, and generates verifiable Digital Material Passports.

**Key Technologies:**
- Backend: FastAPI + YOLOv8n + OpenCV + EasyOCR + PyTorch
- Frontend: React 18 + Vite + Tailwind CSS + Recharts + Framer Motion
- Database: SQLite with SQLAlchemy ORM
- Testing: Pytest + Ruff linting

## Development Commands

### Backend (FastAPI Server)

```bash
# From project root, navigate to backend
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server with hot reload
uvicorn app.main:app --reload --port 8000

# Run tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_ocr.py -v

# Lint and format check
ruff check .

# Auto-fix linting issues
ruff check . --fix
```

**Important Backend URLs:**
- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- Healthcheck: http://localhost:8000/api/health

### Frontend (React + Vite)

```bash
# From project root, navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server (proxies /api/* to backend)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Frontend URL:** http://localhost:5173

## Architecture & Key Concepts

### Backend Service Layer Architecture

The backend follows a clean layered architecture with clear separation of concerns:

1. **Routers** (`app/routers/`) - FastAPI endpoints that handle HTTP requests
2. **Services** (`app/services/`) - Business logic engines (domain experts)
3. **Schemas** (`app/schemas/`) - Pydantic models for request/response validation
4. **Database** (`app/database/`) - SQLAlchemy ORM models and session management
5. **Core** (`app/core/`) - Configuration and domain constants

**Critical Service Engines:**

- `vision_service.py` - YOLOv8n computer vision classifier with heuristic fallback
- `ocr_service.py` - 5-step OpenCV preprocessing pipeline + EasyOCR for ISO 11469 stamp parsing
- `bfr_engine.py` - RoHS/POPs compliance engine with BFR hazard scoring (0.0-1.0)
- `thermal_calculator.py` - 3-zone extruder temperature calculator and FDM parameter generator
- `lca_engine.py` - ISO 14040/14044 carbon offset mathematics
- `polymer_kb.py` - Domain knowledge base containing polymer properties, vintage era BFR likelihood, and regulatory limits
- `passport_pdf.py` - ReportLab PDF generator for Digital Material Passports with SHA-256 verification

### Data Flow & Scanner Pipeline

The system has two identification pathways:

**Primary Path (Computer Vision + OCR):**
1. User captures image via CameraHUD → POST `/api/scan/casing` (YOLOv8n classification)
2. User captures mold stamp → POST `/api/scan/stamp` (OpenCV CLAHE + EasyOCR)
3. BFR engine calculates risk score based on polymer + vintage era + stamp markers
4. Results displayed in ScanResultsCard with RoHS compliance badge

**Secondary Path (Benchtop Diagnostic Wizard):**
1. User performs manual sink-float tests (pure water ρ=1.00, brine ρ=1.07, dense ρ=1.15)
2. Interactive decision tree → POST `/api/diagnostic/wizard`
3. System infers polymer from density stratification and visual cues
4. Results merge into same ScanRecord schema

**Batch Aggregation & Passport Generation:**
1. Approved scans added to batches via BatchManager component
2. POST `/api/batches` creates batch with LCA calculations
3. GET `/api/batches/{id}/metrics` retrieves aggregated carbon/mass metrics
4. GET `/api/passport/{id}/pdf` generates downloadable ReportLab PDF with SHA-256 stamp

### Frontend Component Architecture

The React app uses a tab-based navigation system with shared state managed in `App.jsx`:

- **Navbar** - System branding, tab navigation, and status indicator
- **CameraHUD** - WebRTC camera feed, sample image picker, scan trigger buttons
- **ScanResultsCard** - Verification badges, BFR risk gauge, RoHS compliance status
- **DiagnosticWizard** - 5-step interactive decision tree for manual polymer identification
- **ThermalSpecsCard** - 3-zone extruder temperature visualization and drying recommendations
- **LCAMetricsCard** - Recharts visualizations for carbon savings and polymer composition
- **BatchManager** - Scan queue aggregation and batch creation interface
- **PassportModal** - Digital Material Passport viewer with PDF download

**Shared State Pattern:** Scanner results flow from `CameraHUD` → `handleScanComplete()` → `currentScan` state → `ScanResultsCard`, enabling real-time UI updates without prop drilling.

### Database Models

Three core SQLAlchemy models in `app/database/models.py`:

- **ScanRecord** - Individual casing scan with polymer ID, BFR risk, RoHS status, confidence scores
- **BatchRecord** - Aggregated collection with total/usable/rejected mass, CO₂ savings, oil equivalents
- **BatchItem** - Join table linking scans to batches with per-item mass tracking

The system uses SQLite for zero-configuration local storage. The database auto-seeds with a 100kg pilot demonstration batch on first startup (see `seed_demo_data()` in `app/main.py`).

## Important Domain Knowledge

### BFR Hazard Scoring System

The BFR risk engine (`bfr_engine.py`) combines multiple signals:
- **Vintage Era Weight** - Pre-2006 devices have highest BFR probability due to legacy DecaBDE/OctaBDE additives
- **Polymer Type Risk** - HIPS has higher baseline risk than ABS due to processing temperatures
- **Stamp Markers** - ISO 11469 codes like `>ABS-FR(40)<` indicate 40% flame retardant loading by mass
- **Casing Type Heuristics** - CRT housings are high-risk; modern keyboards are low-risk

**Risk Score Interpretation:**
- 0.00-0.15: MINIMAL RISK (green badge) - Clean, approved for direct upcycling
- 0.15-0.40: LOW RISK (cyan badge) - Verify absence of FR stamps, proceed with caution
- 0.40-0.70: MODERATE RISK (yellow badge) - Requires sink-float verification and active ventilation
- 0.70-1.00: HIGH/CRITICAL RISK (red badge) - Reject for mechanical recycling, route to hazardous waste disposal

**RoHS Compliance:** EU Directive 2011/65/EU caps PBDEs at 500-1000 ppm. System rejects scans with risk scores >0.70 as presumptively non-compliant.

### ISO 11469 Stamp Parsing

Mold stamps follow standard format: `>POLYMER_CODE<` or `>POLYMER_CODE-FR(XX)<`

Common codes in polymer_kb.py:
- `>ABS<` - Acrylonitrile Butadiene Styrene (clean)
- `>PS-HI<` or `>HIPS<` - High Impact Polystyrene
- `>PC+ABS<` - Polycarbonate/ABS blend
- `>ABS-FR(40)<` - ABS with 40% flame retardant loading (REJECT)

The OCR pipeline uses CLAHE contrast enhancement, bilateral filtering, morphological gradients, and Otsu binarization to handle low-contrast embossed text.

### LCA Carbon Offset Calculations

Formula from `lca_engine.py`:
```
ΔE_avoided = M_recycled × (EF_virgin - EF_recycling) + M_diverted × EF_landfill_credit - M_recycled × EF_transp
```

**Net Avoidance Factors (kg CO₂e per kg recycled):**
- ABS: +3.02 (≈2.1L crude oil equivalent)
- HIPS: +2.57 (≈1.8L crude oil)
- PC: +6.02 (≈3.9L crude oil)
- PC-ABS: +4.32 (≈2.9L crude oil)

These values are hardcoded domain constants validated against ISO 14040/14044 methodologies.

## Testing Strategy

Backend tests cover critical business logic:
- `test_ocr.py` - ISO 11469 regex parser validation
- `test_bfr.py` - RoHS rejection thresholds and CRT hazard detection
- `test_lca.py` - Carbon offset calculation accuracy
- `test_api.py` - FastAPI endpoint response validation

Run tests before commits affecting service layer logic. The test suite uses synthetic stamp images from `backend/samples/test_stamps/`.

## Common Patterns

**Error Handling:** Services return structured Pydantic responses with fallback values. Frontend API client (`services/api.js`) provides resilient offline mock data when backend unavailable.

**Sound Design:** Frontend uses `utils/sound.js` Web Audio API for UI feedback (blips on scan completion, clicks on modal actions).

**Styling:** Tailwind utility classes with custom dark-mode industrial theme. Glass-morphism panels use `glass-panel` class with backdrop blur. Color system uses emerald-400 for success states, amber-400 for warnings, red-400 for hazards.

**Animation:** Framer Motion powers tab transitions with spring physics (`ease: [0.16, 1, 0.3, 1]`). Ambient gradient orbs provide depth without distraction.

## Development Notes

- The backend serves demo data automatically on fresh database initialization - no manual seeding required
- Frontend Vite config proxies `/api/*` requests to `http://localhost:8000` during development
- YOLOv8n model downloads automatically on first inference (OpenCV via Ultralytics)
- EasyOCR downloads language models to `~/.EasyOCR/` on first run
- SQLite database file created at `backend/polyloop.db` (gitignored)
- The system is designed to run completely offline with no cloud dependencies
