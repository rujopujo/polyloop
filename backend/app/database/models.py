import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database.session import Base


class ScanRecord(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    casing_type = Column(String(64), nullable=False)
    vintage_era = Column(String(64), nullable=False)
    identification_method = Column(String(64), nullable=False)  # OCR_STAMP | SINK_FLOAT_WIZARD | VISION_HEURISTIC
    detected_polymer = Column(String(32), nullable=False)        # ABS, HIPS, PC, PC-ABS
    confidence = Column(Float, nullable=False, default=0.0)
    iso_stamp_text = Column(String(128), nullable=True)
    bfr_risk_score = Column(Float, nullable=False, default=0.0)
    rohs_compliant = Column(Boolean, nullable=False, default=True)
    status = Column(String(32), nullable=False, default="APPROVED")  # APPROVED | REJECTED
    recommended_action = Column(Text, nullable=False)

    batch_items = relationship("BatchItem", back_populates="scan", cascade="all, delete-orphan")


class BatchRecord(Base):
    __tablename__ = "batches"

    id = Column(String(64), primary_key=True, default=lambda: f"BATCH-{uuid.uuid4().hex[:8].upper()}")
    name = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    polymer_type = Column(String(32), nullable=False)
    total_mass_kg = Column(Float, nullable=False, default=0.0)
    usable_mass_kg = Column(Float, nullable=False, default=0.0)
    rejected_mass_kg = Column(Float, nullable=False, default=0.0)
    co2_avoided_kg = Column(Float, nullable=False, default=0.0)
    oil_saved_liters = Column(Float, nullable=False, default=0.0)
    passport_pdf_path = Column(String(256), nullable=True)

    items = relationship("BatchItem", back_populates="batch", cascade="all, delete-orphan")


class BatchItem(Base):
    __tablename__ = "batch_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String(64), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    item_mass_kg = Column(Float, nullable=False, default=1.0)

    batch = relationship("BatchRecord", back_populates="items")
    scan = relationship("ScanRecord", back_populates="batch_items")
