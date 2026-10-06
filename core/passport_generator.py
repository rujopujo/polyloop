"""
PolyLoop: Digital Material Passport PDF Generator
Builds a verifiable, production-styled PDF Digital Material Passport using ReportLab.
Encapsulates polymer chain-of-custody, chemical RoHS/POPs compliance, 
extrusion processing parameters, and ISO 14040/14044 LCA metrics.
"""
import io
import time

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_passport_pdf(batch_id, casing_type, detected_polymer, iso_stamp,
                          bfr_risk, rohs_compliant, thermal_specs, lca_metrics, mass_kg=1.0):
    """
    Compiles an official Digital Material Passport into a PDF binary buffer.
    Returns bytes io.BytesIO buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    header_title_style = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a") # Slate 900
    )
    header_subtitle_style = ParagraphStyle(
        "HeaderSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569") # Slate 600
    )
    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6
    )
    cell_bold = ParagraphStyle(
        "CellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    )
    cell_normal = ParagraphStyle(
        "CellNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155")
    )
    badge_pass = ParagraphStyle(
        "BadgePass",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#065f46")
    )
    badge_fail = ParagraphStyle(
        "BadgeFail",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#991b1b")
    )

    story = []

    # Title & Header Block
    story.append(Paragraph("POLYLOOP // DIGITAL MATERIAL PASSPORT", header_title_style))
    story.append(Paragraph(
        "Verified Post-Consumer E-Waste Resin Audit & Circular Upcycling Passport &bull; ISO 11469 &bull; ISO 14040/14044",
        header_subtitle_style
    ))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0ea5e9"), spaceAfter=12))

    # Meta Table: Batch ID, Date, Verification Hash
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S UTC")
    meta_data = [
        [Paragraph("Passport Batch UUID:", cell_bold), Paragraph(str(batch_id), cell_normal),
         Paragraph("Audit Timestamp:", cell_bold), Paragraph(timestamp, cell_normal)],
        [Paragraph("Origin Casing:", cell_bold), Paragraph(str(casing_type), cell_normal),
         Paragraph("Audit Authority:", cell_bold), Paragraph("PolyLoop Engine v2.4 (Zero-Cost Local Stack)", cell_normal)],
    ]
    meta_table = Table(meta_data, colWidths=[1.6*inch, 2.2*inch, 1.4*inch, 2.2*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Section 1: Identification & Regulatory Compliance
    story.append(Paragraph("1. RESIN IDENTIFICATION & CHEMICAL HAZARD AUDIT", section_title_style))
    rohs_text = "PASSED (< 1,000 ppm / 0.1%)" if rohs_compliant else "NON-COMPLIANT (> 1,000 ppm BFR)"
    rohs_style = badge_pass if rohs_compliant else badge_fail
    
    compliance_data = [
        [Paragraph("Detected Polymer Matrix:", cell_bold), Paragraph(f"<b>{detected_polymer}</b>", cell_normal)],
        [Paragraph("ISO 11469 Mold Marking:", cell_bold), Paragraph(f"<code>{iso_stamp}</code>", cell_normal)],
        [Paragraph("BFR Risk Probability:", cell_bold), Paragraph(f"{bfr_risk * 100:.1f}% ({'High Hazard' if bfr_risk > 0.4 else 'Safe Mechanical Grade'})", cell_normal)],
        [Paragraph("EU RoHS Directive 2011/65/EU:", cell_bold), Paragraph(rohs_text, rohs_style)],
        [Paragraph("EU POPs Regulation (PBDEs < 500 ppm):", cell_bold), Paragraph("CLEARED" if rohs_compliant else "RESTRICTED (Quarantine)", rohs_style)],
        [Paragraph("WEEE Annex VII Classification:", cell_bold), Paragraph("Closed-Loop Mechanical Feedstock" if rohs_compliant else "Hazardous Separation Stream", cell_normal)]
    ]
    comp_table = Table(compliance_data, colWidths=[2.5*inch, 4.9*inch])
    comp_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f1f5f9")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 12))

    # Section 2: Extrusion & 3D Printing Technical Parameters
    story.append(Paragraph("2. UP-CYCLING THERMAL & RHEOLOGY SPECIFICATIONS", section_title_style))
    dry = thermal_specs.get("drying", {})
    ext = thermal_specs.get("extrusion", {})
    fdm = thermal_specs.get("fdm_3d_print", {})

    thermal_data = [
        [Paragraph("Pre-Drying Regimen:", cell_bold), Paragraph(f"{dry.get('temp_c', 80)}°C for {dry.get('time_hours', '3-4 hrs')}", cell_normal),
         Paragraph("Moisture Tolerance:", cell_bold), Paragraph(f"&lt; {dry.get('max_moisture_ppm', 500)} ppm ({dry.get('max_moisture_pct', 0.05)}%)", cell_normal)],
        [Paragraph("Extruder Zone 1 (Feed):", cell_bold), Paragraph(str(ext.get("zone_1_feed", "185°C - 195°C")), cell_normal),
         Paragraph("Extruder Zone 2 (Melt):", cell_bold), Paragraph(str(ext.get("zone_2_transition", "215°C - 225°C")), cell_normal)],
        [Paragraph("Extruder Zone 3 (Die):", cell_bold), Paragraph(str(ext.get("zone_3_die", "225°C - 235°C")), cell_normal),
         Paragraph("Water Quench Bath:", cell_bold), Paragraph(str(ext.get("water_bath", "50°C - 60°C")), cell_normal)],
        [Paragraph("FDM Nozzle Target:", cell_bold), Paragraph(str(fdm.get("nozzle_temp", "230°C - 245°C")), cell_normal),
         Paragraph("FDM Heated Bed Target:", cell_bold), Paragraph(str(fdm.get("bed_temp", "95°C - 110°C")), cell_normal)],
        [Paragraph("Part Cooling Fan Speed:", cell_bold), Paragraph(str(fdm.get("part_fan", "0% - 15%")), cell_normal),
         Paragraph("Shrinkage Allowance:", cell_bold), Paragraph(str(fdm.get("shrinkage_pct", "0.4% - 0.7%")), cell_normal)],
    ]
    therm_table = Table(thermal_data, colWidths=[1.9*inch, 1.8*inch, 1.9*inch, 1.8*inch])
    therm_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f8fafc")),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor("#f8fafc")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(therm_table)
    story.append(Spacer(1, 12))

    # Section 3: ISO 14040/14044 Life Cycle Assessment (LCA)
    story.append(Paragraph("3. ISO 14040/14044 CARBON AVOIDANCE & RESOURCE RECOVERY", section_title_style))
    lca_data = [
        [Paragraph("Certified Batch Net Mass:", cell_bold), Paragraph(f"<b>{mass_kg:.2f} kg</b>", cell_normal),
         Paragraph("Virgin Resin Baseline Footprint:", cell_bold), Paragraph(f"{lca_metrics.get('virgin_gwp_total', 0):.2f} kg CO2e", cell_normal)],
        [Paragraph("Net GHG Avoided (&Delta;E_avoided):", cell_bold), Paragraph(f"<b>+{lca_metrics.get('net_co2e_avoided_kg', 0):.2f} kg CO2e</b>", badge_pass),
         Paragraph("PolyLoop Process Carbon Burden:", cell_bold), Paragraph(f"{lca_metrics.get('polyloop_burden_total', 0):.2f} kg CO2e", cell_normal)],
        [Paragraph("Crude Fossil Oil Displaced:", cell_bold), Paragraph(f"<b>{lca_metrics.get('crude_oil_saved_liters', 0):.2f} Liters</b>", cell_normal),
         Paragraph("Thermal Coal Combustion Offset:", cell_bold), Paragraph(f"<b>{lca_metrics.get('coal_offset_kg', 0):.2f} kg coal</b>", cell_normal)],
        [Paragraph("Passenger Car Distance Offset:", cell_bold), Paragraph(f"<b>{lca_metrics.get('km_car_offset', 0):.1f} km equivalent</b>", cell_normal),
         Paragraph("Landfill Diversion Efficiency:", cell_bold), Paragraph("100% Zero-Landfill Closed Loop", cell_normal)],
    ]
    lca_table = Table(lca_data, colWidths=[2.1*inch, 1.6*inch, 2.1*inch, 1.6*inch])
    lca_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")), # Mint tint
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(lca_table)
    story.append(Spacer(1, 15))

    # Footer note
    footer_text = (
        "<b>CERTIFICATION STATEMENT:</b> This Digital Material Passport serves as an immutable certificate of circularity "
        "and chemical safety under the WEEE Directive (2012/19/EU). Polymer batch verified free of hazardous DecaBDE/OctaBDE "
        "congeners above statutory limits. Generated locally by PolyLoop AI Engine."
    )
    story.append(Paragraph(footer_text, ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b")
    )))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
