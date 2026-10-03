"""Main FastAPI entrypoint for PolyLoop."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import API_V1_STR, PROJECT_NAME, TEST_STAMPS_DIR
from app.database.models import BatchItem, BatchRecord, ScanRecord
from app.database.session import Base, SessionLocal, engine
from app.routers import batch, diagnostic, passport, scan

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def seed_demo_data():
    """Seed synthetic batch and scans if database is fresh, providing an instant rich demo."""
    db = SessionLocal()
    try:
        if db.query(BatchRecord).count() == 0:
            logger.info("Database empty: seeding pilot demonstration batch (100 kg mixed scrap simulation)...")

            # 1. 50 kg ABS Keyboard Housings (Approved, Clean)
            scan1 = ScanRecord(
                id="DEMO-SCAN-ABS-01",
                casing_type="keyboard_mouse_router",
                vintage_era="2018-Present",
                identification_method="OCR_STAMP",
                detected_polymer="ABS",
                confidence=0.96,
                iso_stamp_text=">ABS<",
                bfr_risk_score=0.04,
                rohs_compliant=True,
                status="APPROVED",
                recommended_action="MINIMAL RISK: Clean, high-purity polymer casing. Ideal closed-loop feedstock for 1.75mm FDM filament."
            )
            # 2. 25 kg PC-ABS Laptop Bezels (Approved, Clean)
            scan2 = ScanRecord(
                id="DEMO-SCAN-PCABS-02",
                casing_type="flat_display",
                vintage_era="2019-Present",
                identification_method="OCR_STAMP",
                detected_polymer="PC-ABS",
                confidence=0.93,
                iso_stamp_text=">PC+ABS<",
                bfr_risk_score=0.08,
                rohs_compliant=True,
                status="APPROVED",
                recommended_action="LOW RISK: Approved for direct mechanical granulation, convective drying, and single-screw 3D filament extrusion."
            )
            # 3. 10 kg HIPS Printer Enclosure (Approved, Clean via Sink-Float)
            scan3 = ScanRecord(
                id="DEMO-SCAN-HIPS-03",
                casing_type="printer_panel",
                vintage_era="2014-2017",
                identification_method="SINK_FLOAT_WIZARD",
                detected_polymer="HIPS",
                confidence=0.94,
                iso_stamp_text=">PS-HI<",
                bfr_risk_score=0.22,
                rohs_compliant=True,
                status="APPROVED",
                recommended_action="MODERATE RISK: Verify absence of FR(40) markings; clean thoroughly and extrude with active local exhaust ventilation."
            )
            # 4. 15 kg CRT Monitor Enclosure (Rejected: >2000 ppm DecaBDE / RoHS failure)
            scan4 = ScanRecord(
                id="DEMO-SCAN-CRT-04",
                casing_type="crt_housing",
                vintage_era="Pre-2006",
                identification_method="OCR_STAMP",
                detected_polymer="HIPS",
                confidence=0.91,
                iso_stamp_text=">ABS-FR(40)<",
                bfr_risk_score=0.99,
                rohs_compliant=False,
                status="REJECTED",
                recommended_action="CRITICAL HAZARD: Reject for mechanical upcycling; route to specialized high-temperature WEEE hazardous waste disposal."
            )

            db.add_all([scan1, scan2, scan3, scan4])
            db.commit()

            # Create Pilot 100 kg Batch
            pilot_batch = BatchRecord(
                id="BATCH-EWEM-PILOT-01",
                name="Pilot E-Waste IT Scrap Inflow (100 kg)",
                polymer_type="ABS",
                total_mass_kg=100.0,
                usable_mass_kg=85.0,
                rejected_mass_kg=15.0,
                co2_avoided_kg=284.7,  # (50*3.02) + (25*4.32) + (10*2.57) = 284.7
                oil_saved_liters=205.5,
                passport_pdf_path=None
            )
            db.add(pilot_batch)
            db.commit()

            # Link items
            items = [
                BatchItem(id="BI-01", batch_id=pilot_batch.id, scan_id=scan1.id, item_mass_kg=50.0),
                BatchItem(id="BI-02", batch_id=pilot_batch.id, scan_id=scan2.id, item_mass_kg=25.0),
                BatchItem(id="BI-03", batch_id=pilot_batch.id, scan_id=scan3.id, item_mass_kg=10.0),
                BatchItem(id="BI-04", batch_id=pilot_batch.id, scan_id=scan4.id, item_mass_kg=15.0),
            ]
            db.add_all(items)
            db.commit()
            logger.info("Demo batch and records seeded successfully.")
    except Exception as e:
        logger.warning(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()


# Ensure database tables exist immediately
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed demo data
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    yield
    # Shutdown logic if any


app = FastAPI(
    title=PROJECT_NAME,
    description="Zero-Cost E-Waste Plastic Identification, BFR Hazard Screening, and Closed-Loop Upcycling System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(scan.router, prefix=API_V1_STR)
app.include_router(diagnostic.router, prefix=API_V1_STR)
app.include_router(batch.router, prefix=API_V1_STR)
app.include_router(passport.router, prefix=API_V1_STR)


@app.get("/")
def root():
    return {
        "system": PROJECT_NAME,
        "status": "OPERATIONAL",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "database": "connected",
        "vision_engine": "ready",
        "ocr_engine": "ready"
    }
