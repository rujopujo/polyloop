from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.scan import ScanRecordResponse


class BatchItemCreate(BaseModel):
    scan_id: str
    mass_kg: float = Field(..., gt=0, description="Mass of the component in kg")


class BatchCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Batch reference name")
    polymer_type: str = Field(..., description="Target polymer family (ABS, HIPS, PC, PC-ABS)")
    items: List[BatchItemCreate] = Field(..., min_length=1)


class PolymerCompositionMetric(BaseModel):
    polymer: str
    mass_kg: float
    percentage: float


class BatchMetricsResponse(BaseModel):
    batch_id: str
    batch_name: str
    target_polymer: str
    created_at: datetime
    total_inflow_mass_kg: float
    usable_mass_kg: float
    rejected_mass_kg: float
    net_co2_avoided_kg: float
    crude_oil_saved_liters: float
    coal_offset_kg: float
    km_driven_offset: float
    circularity_yield_percent: float
    virgin_resin_carbon_kg: float
    polyloop_process_carbon_kg: float
    composition_breakdown: List[PolymerCompositionMetric]
    rohs_rejection_count: int


class BatchItemResponse(BaseModel):
    id: str
    batch_id: str
    scan_id: str
    item_mass_kg: float
    scan: Optional[ScanRecordResponse] = None

    model_config = ConfigDict(from_attributes=True)


class BatchRecordResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    polymer_type: str
    total_mass_kg: float
    usable_mass_kg: float
    rejected_mass_kg: float
    co2_avoided_kg: float
    oil_saved_liters: float
    passport_pdf_path: Optional[str] = None
    items: Optional[List[BatchItemResponse]] = None

    model_config = ConfigDict(from_attributes=True)
