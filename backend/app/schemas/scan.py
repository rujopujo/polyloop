from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.polymer import ThermalSpecs


class CasingScanResponse(BaseModel):
    casing_type: str
    label: str
    confidence: float
    vintage_era: str
    baseline_bfr_risk: float
    hazard_tier: str
    primary_polymers: List[str]
    recommended_action: str
    bounding_box: Optional[List[int]] = None  # [x1, y1, x2, y2]


class StampScanResponse(BaseModel):
    scan_id: Optional[str] = None
    polymer_detected: str
    confidence: float
    raw_ocr_text: str
    iso_stamp_found: bool
    iso_stamp_text: Optional[str] = None
    flame_retardant_code: Optional[str] = None
    bfr_risk_score: float
    hazard_tier: str
    rohs_compliant: bool
    status: str  # APPROVED | REJECTED
    recommended_action: str
    thermal_specs: Optional[ThermalSpecs] = None
    preprocessed_image_base64: Optional[str] = None


class DiagnosticWizardRequest(BaseModel):
    casing_type: Optional[str] = "unknown_housing"
    vintage_era: Optional[str] = "2000-2015"
    water_test: str = Field(..., description="'floats' or 'sinks'")
    nacl_test: Optional[str] = Field(None, description="'floats', 'sinks', or 'not_tested'")
    brine_test: Optional[str] = Field(None, description="'floats', 'neutral', 'sinks', or 'not_tested'")
    acetone_reaction: Optional[str] = Field(None, description="'tacky_paste', 'slow_swell', 'minor_haze', or 'resistant'")
    limonene_reaction: Optional[str] = Field(None, description="'dissolves_gel', 'inert', or 'not_tested'")
    beilstein_flame: Optional[str] = Field(None, description="'green', 'yellow_orange', 'sooty_orange', or 'none'")


class DiagnosticWizardResponse(BaseModel):
    scan_id: Optional[str] = None
    polymer_detected: str
    confidence: float
    bfr_risk_score: float
    hazard_tier: str
    rohs_compliant: bool
    status: str
    reasoning: List[str]
    recommended_action: str
    thermal_specs: Optional[ThermalSpecs] = None


class ScanRecordResponse(BaseModel):
    id: str
    created_at: datetime
    casing_type: str
    vintage_era: str
    identification_method: str
    detected_polymer: str
    confidence: float
    iso_stamp_text: Optional[str] = None
    bfr_risk_score: float
    rohs_compliant: bool
    status: str
    recommended_action: str

    model_config = ConfigDict(from_attributes=True)
