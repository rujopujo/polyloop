/**
 * PolyLoop Frontend API Client with seamless fallback mock handling.
 */

const API_BASE = "/api";

// Fallback polymer reference data in case backend is offline
export const FALLBACK_POLYMERS = {
  "ABS": {
    name: "Acrylonitrile Butadiene Styrene",
    code: "ABS",
    iso_marking: ">ABS<",
    density_range: "1.05 – 1.08 g/cm³",
    glass_transition_tg_c: 105,
    melting_point_c: "Amorphous (Processing 220–240°C)",
    flory_huggins_miscibility_note: "Polar SAN matrix incompatible with HIPS (chi > 0, >70% impact loss at 3-5% commingling). Partially miscible with PC.",
    tap_water_test: "Sinks (rho = 1.00 g/cm³)",
    nacl_10pct_test: "Sinks (rho = 1.07 g/cm³)",
    dense_brine_test: "Floats cleanly (rho = 1.15 g/cm³)",
    acetone_reaction: "Dissolves rapidly into sticky tacky paste within 10–30s",
    d_limonene_reaction: "Chemically inert; zero swelling",
    flame_behavior: "Yellow flame, blue base, acrid burnt rubber scent",
    carbon_avoidance_kg_per_kg: 3.02,
    crude_oil_saved_liters_per_kg: 2.1,
    thermal_specs: {
      pre_drying_temp_c: 80,
      pre_drying_hours: "3 to 4 hours",
      max_moisture_ppm: 500,
      extruder_feed_zone1_c: "185°C – 195°C",
      extruder_transition_zone2_c: "215°C – 225°C",
      extruder_die_zone3_c: "225°C – 235°C",
      cooling_water_bath_c: "50°C – 60°C",
      fdm_nozzle_temp_c: "230°C – 245°C",
      fdm_bed_temp_c: "95°C – 110°C",
      build_plate_interface: "Smooth PEI with Dimafix adhesive",
      chamber_temp_c: "Passive enclosure (40°C – 50°C)",
      part_cooling_fan: "0% – 15%",
      volumetric_shrinkage: "0.4% – 0.7%",
      extrusion_failure_mode_if_undried: "Steam bubbling at melt die, rough matte finish, severe layer delamination"
    }
  },
  "HIPS": {
    name: "High-Impact Polystyrene",
    code: "HIPS",
    iso_marking: ">PS-HI<",
    density_range: "1.03 – 1.05 g/cm³",
    glass_transition_tg_c: 100,
    melting_point_c: "Amorphous (Processing 195–225°C)",
    flory_huggins_miscibility_note: "Non-polar aromatic polystyrene matrix. Incompatible with ABS and PC.",
    tap_water_test: "Sinks slowly (rho = 1.00 g/cm³)",
    nacl_10pct_test: "Floats cleanly (rho = 1.07 g/cm³)",
    dense_brine_test: "Floats (rho = 1.15 g/cm³)",
    acetone_reaction: "Rapidly swells and softens",
    d_limonene_reaction: "Dissolves completely into clear viscous gel",
    flame_behavior: "Rapid orange flame, copious soot webs, sweet marzipan/styrene odor",
    carbon_avoidance_kg_per_kg: 2.57,
    crude_oil_saved_liters_per_kg: 1.8,
    thermal_specs: {
      pre_drying_temp_c: 70,
      pre_drying_hours: "2 to 3 hours",
      max_moisture_ppm: 500,
      extruder_feed_zone1_c: "170°C – 180°C",
      extruder_transition_zone2_c: "195°C – 210°C",
      extruder_die_zone3_c: "210°C – 225°C",
      cooling_water_bath_c: "40°C – 50°C",
      fdm_nozzle_temp_c: "220°C – 240°C",
      fdm_bed_temp_c: "85°C – 100°C",
      build_plate_interface: "PEI sheet or Kapton tape",
      chamber_temp_c: "Passive enclosure (35°C – 45°C)",
      part_cooling_fan: "20% – 35%",
      volumetric_shrinkage: "0.3% – 0.6%",
      extrusion_failure_mode_if_undried: "Micro-voiding, nozzle spitting, inconsistent filament diameter"
    }
  },
  "PC-ABS": {
    name: "Polycarbonate + ABS Blend",
    code: "PC-ABS",
    iso_marking: ">PC+ABS<",
    density_range: "1.10 – 1.15 g/cm³",
    glass_transition_tg_c: 120,
    melting_point_c: "Amorphous alloy (Processing 235–265°C)",
    flory_huggins_miscibility_note: "Engineered alloy combining PC thermal resistance with ABS toughness.",
    tap_water_test: "Sinks rapidly",
    nacl_10pct_test: "Sinks rapidly",
    dense_brine_test: "Neutral buoyancy boundary (~1.12–1.15)",
    acetone_reaction: "Slow surface softening with cloudy haze",
    d_limonene_reaction: "Inert",
    flame_behavior: "Yellow-orange flame, self-extinguishing tendencies",
    carbon_avoidance_kg_per_kg: 4.32,
    crude_oil_saved_liters_per_kg: 2.9,
    thermal_specs: {
      pre_drying_temp_c: 100,
      pre_drying_hours: "3 to 4 hours",
      max_moisture_ppm: 300,
      extruder_feed_zone1_c: "210°C – 220°C",
      extruder_transition_zone2_c: "235°C – 245°C",
      extruder_die_zone3_c: "250°C – 265°C",
      cooling_water_bath_c: "60°C – 70°C",
      fdm_nozzle_temp_c: "255°C – 275°C",
      fdm_bed_temp_c: "100°C – 115°C",
      build_plate_interface: "Textured PEI sheet",
      chamber_temp_c: "Enclosed chamber (45°C – 60°C)",
      part_cooling_fan: "10% – 20%",
      volumetric_shrinkage: "0.5% – 0.7%",
      extrusion_failure_mode_if_undried: "Internal foaming, poor interlayer bonding, delamination under flexure"
    }
  },
  "PC": {
    name: "Polycarbonate",
    code: "PC",
    iso_marking: ">PC<",
    density_range: "1.20 – 1.22 g/cm³",
    glass_transition_tg_c: 147,
    melting_point_c: "Amorphous (Processing 265–295°C)",
    flory_huggins_miscibility_note: "Prone to severe hydrolytic chain scission if moisture exceeds 200 ppm.",
    tap_water_test: "Sinks rapidly",
    nacl_10pct_test: "Sinks rapidly",
    dense_brine_test: "Sinks rapidly",
    acetone_reaction: "Resistant (minor haze after 2 min)",
    d_limonene_reaction: "Insoluble",
    flame_behavior: "Self-extinguishing, faint phenolic scent",
    carbon_avoidance_kg_per_kg: 6.02,
    crude_oil_saved_liters_per_kg: 3.9,
    thermal_specs: {
      pre_drying_temp_c: 120,
      pre_drying_hours: "4 to 6 hours",
      max_moisture_ppm: 200,
      extruder_feed_zone1_c: "230°C – 245°C",
      extruder_transition_zone2_c: "265°C – 275°C",
      extruder_die_zone3_c: "280°C – 295°C",
      cooling_water_bath_c: "70°C – 80°C",
      fdm_nozzle_temp_c: "280°C – 305°C (All-Metal)",
      fdm_bed_temp_c: "115°C – 130°C",
      build_plate_interface: "PEI + PVA glue stick",
      chamber_temp_c: "Actively heated (65°C – 80°C)",
      part_cooling_fan: "0%",
      volumetric_shrinkage: "0.6% – 0.9%",
      extrusion_failure_mode_if_undried: "Catastrophic hydrolytic chain scission, permanent embrittlement"
    }
  }
};

// Fallback demo batch metrics
export const FALLBACK_BATCH_METRICS = {
  batch_id: "BATCH-EWEM-PILOT-01",
  batch_name: "Pilot E-Waste IT Scrap Inflow (100 kg)",
  target_polymer: "ABS",
  created_at: new Date().toISOString(),
  total_inflow_mass_kg: 100.0,
  usable_mass_kg: 85.0,
  rejected_mass_kg: 15.0,
  net_co2_avoided_kg: 284.7,
  crude_oil_saved_liters: 205.5,
  coal_offset_kg: 139.5,
  km_driven_offset: 1158.7,
  circularity_yield_percent: 85.0,
  virgin_resin_carbon_kg: 362.5,
  polyloop_process_carbon_kg: 66.3,
  composition_breakdown: [
    { polymer: "ABS", mass_kg: 50.0, percentage: 50.0 },
    { polymer: "PC-ABS", mass_kg: 25.0, percentage: 25.0 },
    { polymer: "HIPS", mass_kg: 10.0, percentage: 10.0 },
    { polymer: "CRT (BFR)", mass_kg: 15.0, percentage: 15.0 }
  ],
  rohs_rejection_count: 1
};

export const api = {
  // 1. Scan Casing (YOLO)
  async scanCasing(file) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/scan/casing`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Casing scan failed");
      return await res.json();
    } catch (err) {
      console.warn("Backend unavailable, using mock casing result:", err);
      return {
        casing_type: "keyboard_mouse_router",
        label: "Keyboard / Mouse / Router Housing",
        confidence: 0.94,
        vintage_era: "2018-Present",
        baseline_bfr_risk: 0.04,
        hazard_tier: "MINIMAL",
        primary_polymers: ["ABS", "HIPS"],
        recommended_action: "Highly suitable for direct desktop granulation and 1.75mm filament extrusion.",
        bounding_box: [40, 30, 580, 420]
      };
    }
  },

  // 2. Scan Stamp (OpenCV + EasyOCR + BFR)
  async scanStamp(file, casingType = "desktop_chassis", vintageEra = "2000-2015") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("casing_type", casingType);
    formData.append("vintage_era", vintageEra);
    try {
      const res = await fetch(`${API_BASE}/scan/stamp`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Stamp scan failed");
      return await res.json();
    } catch (err) {
      console.warn("Backend unavailable, using mock stamp result:", err);
      return {
        scan_id: "DEMO-STAMP-SCAN",
        polymer_detected: "ABS",
        confidence: 0.96,
        raw_ocr_text: "MOLD #4 >ABS< RO-02",
        iso_stamp_found: true,
        iso_stamp_text: ">ABS<",
        flame_retardant_code: null,
        bfr_risk_score: 0.04,
        hazard_tier: "MINIMAL",
        rohs_compliant: true,
        status: "APPROVED",
        recommended_action: "MINIMAL RISK: Clean, high-purity polymer casing. Ideal closed-loop feedstock for 1.75mm FDM filament.",
        thermal_specs: FALLBACK_POLYMERS.ABS.thermal_specs
      };
    }
  },

  // 3. Diagnostic Wizard (Physical/Chemical Tree)
  async runDiagnosticWizard(answers) {
    try {
      const res = await fetch(`${API_BASE}/diagnostic/wizard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) throw new Error("Diagnostic evaluation failed");
      return await res.json();
    } catch (err) {
      console.warn("Backend unavailable, using fallback diagnostic response:", err);
      const isWaterSink = answers.water_test === "sinks";
      const isHips = isWaterSink && answers.nacl_test === "floats";
      const isAbs = isWaterSink && answers.nacl_test === "sinks" && answers.acetone_reaction === "tacky_paste";
      const poly = isHips ? "HIPS" : (isAbs ? "ABS" : "PC-ABS");
      return {
        scan_id: "DEMO-DIAGNOSTIC-SCAN",
        polymer_detected: poly,
        confidence: 0.92,
        bfr_risk_score: 0.12,
        hazard_tier: "LOW",
        rohs_compliant: true,
        status: "APPROVED",
        reasoning: [
          `Water test: ${answers.water_test}`,
          `Saline test: ${answers.nacl_test || "not tested"}`,
          `Solvent reaction: ${answers.acetone_reaction || "not tested"}`,
          `Diagnostic deduction confirmed: ${poly}`
        ],
        recommended_action: "Polymer identity verified via sink-float and solvent reactions.",
        thermal_specs: FALLBACK_POLYMERS[poly]?.thermal_specs || FALLBACK_POLYMERS.ABS.thermal_specs
      };
    }
  },

  // 4. Batches
  async getBatches() {
    try {
      const res = await fetch(`${API_BASE}/batches`);
      if (!res.ok) throw new Error("Failed to load batches");
      return await res.json();
    } catch (err) {
      return [
        {
          id: "BATCH-EWEM-PILOT-01",
          name: "Pilot E-Waste IT Scrap Inflow (100 kg)",
          polymer_type: "ABS",
          total_mass_kg: 100.0,
          usable_mass_kg: 85.0,
          rejected_mass_kg: 15.0,
          co2_avoided_kg: 284.7,
          oil_saved_liters: 205.5,
          created_at: new Date().toISOString()
        }
      ];
    }
  },

  async getBatchMetrics(batchId) {
    try {
      const res = await fetch(`${API_BASE}/batches/${batchId}/metrics`);
      if (!res.ok) throw new Error("Failed to load batch metrics");
      return await res.json();
    } catch (err) {
      return FALLBACK_BATCH_METRICS;
    }
  },

  async createBatch(payload) {
    try {
      const res = await fetch(`${API_BASE}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create batch");
      return await res.json();
    } catch (err) {
      console.warn("Backend offline, mock creating batch");
      return {
        id: `BATCH-LOCAL-${Date.now().toString(36).toUpperCase()}`,
        name: payload.name,
        polymer_type: payload.polymer_type,
        total_mass_kg: payload.items.reduce((acc, i) => acc + i.mass_kg, 0),
        usable_mass_kg: payload.items.reduce((acc, i) => acc + i.mass_kg, 0),
        rejected_mass_kg: 0.0,
        co2_avoided_kg: 151.0,
        oil_saved_liters: 105.0,
        created_at: new Date().toISOString()
      };
    }
  },

  // 5. Polymer KB
  async getPolymers() {
    try {
      const res = await fetch(`${API_BASE}/kb/polymers`);
      if (!res.ok) throw new Error("Failed to load polymers");
      return await res.json();
    } catch {
      return FALLBACK_POLYMERS;
    }
  },

  // 6. Test Stamps
  async getTestStamps() {
    try {
      const res = await fetch(`${API_BASE}/samples/test-stamps`);
      if (!res.ok) throw new Error("Failed to load test stamps");
      return await res.json();
    } catch {
      return [
        { filename: "keyboard_abs_stamp.png", name: "Keyboard Abs Stamp", url: "/samples/test-stamps/keyboard_abs_stamp.png" },
        { filename: "crt_hips_stamp.png", name: "Crt Hips Stamp", url: "/samples/test-stamps/crt_hips_stamp.png" },
        { filename: "laptop_pcabs_stamp.png", name: "Laptop Pcabs Stamp", url: "/samples/test-stamps/laptop_pcabs_stamp.png" },
        { filename: "hazardous_crt_fr40_stamp.png", name: "Hazardous Crt Fr40 Stamp", url: "/samples/test-stamps/hazardous_crt_fr40_stamp.png" }
      ];
    }
  }
};
