from typing import List, Optional

from pydantic import BaseModel, Field


class ThermalSpecs(BaseModel):
    pre_drying_temp_c: int = Field(..., description="Pre-drying temperature in Celsius")
    pre_drying_hours: str = Field(..., description="Required drying duration")
    max_moisture_ppm: int = Field(..., description="Maximum moisture limit in parts per million")
    extruder_feed_zone1_c: str = Field(..., description="Feed Zone 1 temperature range")
    extruder_transition_zone2_c: str = Field(..., description="Transition Zone 2 temperature range")
    extruder_die_zone3_c: str = Field(..., description="Die Zone 3 temperature range")
    cooling_water_bath_c: str = Field(..., description="Water bath cooling temperature")
    fdm_nozzle_temp_c: str = Field(..., description="FDM 3D printer nozzle temperature range")
    fdm_bed_temp_c: str = Field(..., description="FDM 3D printer heated bed temperature range")
    build_plate_interface: str = Field(..., description="Adhesion surface recommendations")
    chamber_temp_c: str = Field(..., description="Chamber temperature specifications")
    part_cooling_fan: str = Field(..., description="Cooling fan speed percentage")
    volumetric_shrinkage: str = Field(..., description="Volumetric thermal shrinkage range")
    extrusion_failure_mode_if_undried: str = Field(..., description="Failure mode if dried improperly")


class PolymerProfile(BaseModel):
    name: str
    code: str
    iso_marking: str
    density_range: str
    glass_transition_tg_c: Optional[int] = None
    melting_point_c: Optional[str] = None
    flory_huggins_miscibility_note: str
    tap_water_test: str
    nacl_10pct_test: str
    dense_brine_test: str
    acetone_reaction: str
    d_limonene_reaction: str
    flame_behavior: str
    thermal_specs: ThermalSpecs
    carbon_avoidance_kg_per_kg: float
    crude_oil_saved_liters_per_kg: float
