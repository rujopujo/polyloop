# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

- Python 3.11 in conda environment `reform` at `C:\Users\iomth\.conda\envs\reform`
- CUDA 11.8 + cuDNN 8.6 installed via conda `-c nvidia` channel → RTX 4050 GPU is used for training/inference
- Dependencies: `requirements.txt` (TensorFlow 2.15, OpenCV 4.11, EasyOCR, Streamlit, scikit-learn, thefuzz)
- No GPU on CPU-only machines (e.g. Colab free tier): training is possible but slow (~hours); GPU training with RTX 4050 takes ~45–60 min.

## Common commands

```bash
# Activate environment (Windows PowerShell)
conda activate reform

# Run the FastAPI web application
uvicorn server:app --host 127.0.0.1 --port 7860 --reload
# or launch PWA + Cloudflare tunnel:
start_tunnel.bat

# Run the Streamlit app
streamlit run app.py

# Train models
jupyter notebook notebooks/train.ipynb        # run Cell 1, 3/4, then 7, 9, 10, 14
# or CLI training:
python scripts/train_models.py --stage 1

# Inspect models / verify GPU
python scripts/check_env.py

# Re-run training after a stopped session
# Restart Jupyter kernel, then run: Cell 3 (or 4) → Cell 8 → Cell 10 → Cell 14
# Cells 7/9 skip if models already trained in models/
```

## High-level architecture

Three-stage design. A photo alone **cannot** identify polymer type (ABS, PC, HIPS look identical), so the pipeline is honest about this:

```
┌──────────────┐
│ Step 1 photo │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│ Stage 0: MobileNetV2 material   │─► non-plastic ──► data/nonplastic_routes.json (smelting, PCB precious-metal
│ sorter → 6 classes              │     routing      recovery, battery hazardous handling, etc.)
│ (plastic / metal / PCB / glass/  │
│  battery / unknown, 70% thresh) │
└──────────────┬──────────────────┘
               │ predicts plastic
               ▼
┌─────────────────────────────────┐
│ Stage 1: MobileNetV2 item class │─► if confidence < 70% or 'unknown' → retake prompt
│ iff plastic → 7 classes         │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Step 2: close-up resin-code     │ EasyOCR + OpenCV preproc (crop/CLAHE/threshold)
│ photo + OCR + fuzzy match       │ → matches {>ABS<, >PC+ABS<, >PC<, >PS/HIPS<, >PP<,
│ ISO 11469 codes                 │ >PVC<, >PE<}                          │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Result: material + item +       │ from data/knowledge_base.json
│ plastic type (conf. by OCR) +   │
│ BFR hazards / handling / reuse  │
│ + EPR regulation note (India's  │
│ E-Waste (Management) Rules 2022)│
└─────────────────────────────────┘
```

**Explainability:** Grad-CAM heatmap overlay for Stage 0 and Stage 1 predictions (`src/gradcam.py`), reused by `src/app.py`, `src/server.py`, and `notebooks/train.ipynb`.

## Key files

| File | Purpose |
|---|---|
| `server.py` & `src/server.py` | FastAPI backend & REST API endpoints: loads models once, serves `/api/step1-classify`, `/api/step2-ocr`, `/api/health`, and static PWA assets |
| `app.py` & `src/app.py` | Streamlit UI: `@st.cache_resource` loads models once, `st.camera_input` (+ `st.file_uploader` fallback), Stage 0→Stage 1 routing, OCR step, result display with BFR warnings and regulation notes |
| `src/gradcam.py` | Reusable Grad-CAM: `get_gradcam_heatmap()`, `overlay_heatmap()`, `preprocess_for_gradcam()` (handles BGR↔RGB and model-specific preprocessing), `LAST_CONV_LAYER` mapping for each model |
| `notebooks/train.ipynb` | Transfer-learning training: MobileNetV2 (primary), EfficientNetB0, MobileNetV3Large; phase 1 (frozen base, 15 epochs) + phase 2 (fine-tune last 30 layers at LR 1e-5, 10 epochs); class-weighted on imbalanced data; saves best model per epoch |
| `data/knowledge_base.json` | Item/plastic docs: typical plastic, recyclability, BFR risk, hazards, handling rules, reuse options, regulation note, source citation field |
| `data/nonplastic_routes.json` | Recovery routing for non-plastic materials + hazards |
| `data/stage0/`, `data/stage1/` | Train/val/test (70/15/15), one image per leaf folder |
| `models/` | Trained `.keras` models + `classes.json` maps + comparison table + Grad-CAM previews |
| `scripts/` | Dataset ingestion (`add_images.py`), Kaggle downloader (`download_datasets.py`), class reorganizer (`organise_dataset.py`), headless trainer (`train_models.py`), and launcher scripts (`start_tunnel.bat`, `start_tunnel.ps1`) |
| `docs/` | Deployment guides for Hugging Face Spaces (`DEPLOYMENT_GUIDE.md`) and mobile PWA with Cloudflare Tunnel (`PWA_CLOUDFLARE_GUIDE.md`) |
| `requirements.txt` | pinned dependencies for `reform` env |

## Dataset

- Roboflow "E-Waste Detector.v1i" folder dataset, plus Roboflow garbage-classification subset
- Stage 0 classes: `plastic`, `metal`, `PCB`, `glass_screen`, `battery`, `unknown` (6)
- Stage 1 classes: `keyboard`, `mouse`, `printer_casing`, `tv_panel`, `remote`, `other_plastic`, `unknown` (7)
- `cable_wire` and `charger_casing` were dropped (no images in the source)
- Class-weighted training is required: `plastic` (0.36) is heavily over-represented, `PCB`/`battery`/`glass_screen` down-weighted (weights printed at generator start)
- Class weights printed at generator start for reference in reports

## Known issues / gotchas

- **`train.ipynb` cell 5 is corrupted** (class lists show `metaattery`, `mounel` etc.). It is never executed — Cell 4 (data paths, correct class lists) and Cell 8 (generators) run fine. Do **not** rely on cell 5; fix or delete it before committing the notebook.
- Empty folders (`cable_wire`, `charger_casing`) must be deleted before training, or the `GatherV2` "indices not in [0,N)" class-weight mismatch error occurs.
- TensorFlow 2.15 requires CUDA 11.8 + cuDNN 8.6 for GPU; installed via `conda install -c nvidia cuda-toolkit=11.8 cudnn=8.6`.
- No GPU available in Colab CPU mode; download models after training and keep them in `models/`.
- OpenCV loads BGR; the app and Grad-CAM must convert to RGB before display/preprocessing.
- `app.py` loads models with `@st.cache_resource` once at startup — ensure `stage0_model.keras` and `stage1_model.keras` exist in `models/`, else the app stops with a clear error.
- All results are guidance only; regulation notes and hazard info are marked VERIFY/CITE in the knowledge base and should be checked against current local guidelines before public use.
