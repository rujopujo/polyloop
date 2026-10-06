"""
Generate realistic synthetic e-waste casing and stamp test images using PIL and OpenCV.
Includes simulated plastic textures, molded ventilation grills, embossed ISO 11469 stamps,
recessed screw ports, model serial stickers, and lighting shadows.
"""
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw

DEFAULT_OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_images"))

def create_synthetic_samples(output_dir=None):
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Vintage CRT TV / Monitor Backing (1998 Dell / Sony Style) - High BFR Candidate
    # Material: ABS-FR(40) or HIPS with BFRs, Dark Charcoal Grey, Heavy Grills
    img_crt = Image.new("RGB", (700, 500), color=(45, 47, 52))
    draw = ImageDraw.Draw(img_crt)
    
    # Background texture & casing outline
    draw.rectangle([20, 20, 680, 480], outline=(60, 63, 70), width=4)
    # Beveled casing boundary
    draw.rectangle([40, 40, 660, 460], outline=(35, 37, 42), width=3)
    
    # Ventilation grills (classic CRT horizontal slats)
    for y in range(70, 220, 12):
        draw.rectangle([70, y, 630, y + 6], fill=(25, 27, 30), outline=(55, 58, 65))
    
    # Warning label sticker
    draw.rectangle([80, 260, 280, 360], fill=(220, 215, 180), outline=(50, 50, 50), width=2)
    draw.rectangle([85, 265, 275, 285], fill=(200, 40, 40))
    draw.text((95, 268), "CAUTION / ACHTUNG", fill=(255, 255, 255))
    draw.text((90, 290), "SHOCK HAZARD - DO NOT OPEN", fill=(20, 20, 20))
    draw.text((90, 305), "MODEL: CM-780 CRT (1998)", fill=(20, 20, 20))
    draw.text((90, 320), "RATING: 120/240V ~ 50/60Hz", fill=(20, 20, 20))
    draw.text((90, 335), "MFG IN MEXICO | CLASS 1", fill=(60, 60, 60))
    
    # Molded embossed stamp area (Reversed angle brackets >ABS-FR(40)<)
    # We simulate 3D relief with highlight and shadow
    stamp_x, stamp_y = 350, 300
    draw.rectangle([stamp_x - 10, stamp_y - 10, stamp_x + 280, stamp_y + 80], outline=(35, 37, 42), width=2)
    # Shadow offset
    draw.text((stamp_x + 2, stamp_y + 2), ">ABS-FR(40)<", fill=(20, 22, 25))
    # Highlight
    draw.text((stamp_x - 1, stamp_y - 1), ">ABS-FR(40)<", fill=(75, 78, 88))
    # Main embossed face
    draw.text((stamp_x, stamp_y), ">ABS-FR(40)<", fill=(52, 55, 62))
    
    draw.text((stamp_x, stamp_y + 35), "CAV 3 - MOLD #B-1998", fill=(65, 68, 75))
    
    # Recessed screw ports
    for cx, cy in [(60, 440), (640, 440), (60, 60), (640, 60)]:
        draw.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], fill=(25, 26, 30), outline=(60, 63, 70), width=2)
        draw.line([cx - 8, cy, cx + 8, cy], fill=(80, 85, 95), width=2)
        draw.line([cx, cy - 8, cx, cy + 8], fill=(80, 85, 95), width=2)
    
    # Convert to OpenCV, add Gaussian noise/grain for authentic mold texture
    crt_np = np.array(img_crt)
    noise = np.random.normal(0, 4, crt_np.shape).astype(np.int16)
    crt_noisy = np.clip(crt_np + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(output_dir, "crt_monitor_back_bfr_hazard.jpg"), cv2.cvtColor(crt_noisy, cv2.COLOR_RGB2BGR))
    
    # 2. Office Laser Printer Side Panel (2006 Vintage) - HIPS (>PS-HI< or >HIPS<)
    # Light warm office beige/gray, textured matte
    img_print = Image.new("RGB", (700, 500), color=(205, 202, 195))
    draw = ImageDraw.Draw(img_print)
    
    # Panel boundary & clip latches
    draw.rectangle([30, 30, 670, 470], outline=(170, 166, 158), width=3)
    draw.rectangle([50, 50, 650, 450], outline=(225, 222, 215), width=2)
    
    # Handle pocket
    draw.rectangle([250, 80, 450, 140], fill=(165, 160, 150), outline=(130, 126, 118), width=2)
    draw.text((310, 105), "PULL TO OPEN", fill=(110, 105, 95))
    
    # Ribbed stiffeners
    for y in range(180, 340, 30):
        draw.line([80, y, 620, y], fill=(185, 180, 172), width=3)
        draw.line([80, y + 2, 620, y + 2], fill=(225, 221, 214), width=1)
        
    # Embossed mold stamp >PS-HI<
    sx, sy = 240, 380
    draw.rectangle([sx - 15, sy - 15, sx + 220, sy + 65], outline=(180, 176, 168), width=2)
    draw.text((sx + 2, sy + 2), ">PS-HI<", fill=(150, 145, 138))
    draw.text((sx - 1, sy - 1), ">PS-HI<", fill=(240, 238, 232))
    draw.text((sx, sy), ">PS-HI<", fill=(200, 196, 188))
    draw.text((sx, sy + 30), "HP LJ-2400 SERIES", fill=(160, 155, 148))
    
    print_np = np.array(img_print)
    noise = np.random.normal(0, 3, print_np.shape).astype(np.int16)
    print_noisy = np.clip(print_np + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(output_dir, "printer_panel_hips.jpg"), cv2.cvtColor(print_noisy, cv2.COLOR_RGB2BGR))
    
    # 3. ThinkPad / Enterprise Laptop Bottom Shell (2020) - PC+ABS (>PC+ABS<)
    # Sleek raven black/matte dark charcoal with rubber feet & intake grilles
    img_lap = Image.new("RGB", (700, 500), color=(30, 32, 35))
    draw = ImageDraw.Draw(img_lap)
    
    draw.rectangle([25, 25, 675, 475], outline=(48, 52, 58), width=3)
    
    # Rubber feet
    for fx, fy in [(70, 70), (630, 70), (70, 430), (630, 430)]:
        draw.rounded_rectangle([fx - 25, fy - 10, fx + 25, fy + 10], radius=5, fill=(18, 19, 21), outline=(50, 55, 60))
        
    # Cooling fan intake slot pattern
    for x in range(120, 340, 14):
        for y in range(120, 260, 12):
            draw.rectangle([x, y, x + 8, y + 6], fill=(12, 13, 15), outline=(40, 44, 48))
            
    # Windows license / Regulatory badge recess
    draw.rectangle([400, 120, 600, 240], fill=(24, 25, 28), outline=(45, 48, 54), width=2)
    draw.text((420, 140), "LENOVO LAPTOP P52s", fill=(120, 125, 135))
    draw.text((420, 160), "TYPE: 20LB-0015US", fill=(90, 95, 105))
    draw.text((420, 180), "INPUT: 20V === 3.25A", fill=(90, 95, 105))
    draw.text((420, 205), "MADE IN CHINA 2020", fill=(70, 75, 85))
    
    # Molded embossed stamp >PC+ABS<
    lx, ly = 260, 350
    draw.rectangle([lx - 15, ly - 10, lx + 200, ly + 60], outline=(24, 25, 28), width=2)
    draw.text((lx + 2, ly + 2), ">PC+ABS<", fill=(15, 16, 18))
    draw.text((lx - 1, ly - 1), ">PC+ABS<", fill=(55, 60, 68))
    draw.text((lx, ly), ">PC+ABS<", fill=(33, 36, 40))
    draw.text((lx + 10, ly + 32), "RECYCLE CODE 7", fill=(50, 55, 62))
    
    lap_np = np.array(img_lap)
    noise = np.random.normal(0, 3, lap_np.shape).astype(np.int16)
    lap_noisy = np.clip(lap_np + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(output_dir, "laptop_chassis_pc_abs.jpg"), cv2.cvtColor(lap_noisy, cv2.COLOR_RGB2BGR))
    
    # 4. Desktop PC Workstation Front Bezel (2012) - ABS (>ABS<)
    # Gunmetal / Industrial grey with drive bay cutouts and USB slot outlines
    img_pc = Image.new("RGB", (700, 500), color=(55, 58, 64))
    draw = ImageDraw.Draw(img_pc)
    
    draw.rectangle([30, 20, 670, 480], outline=(75, 80, 90), width=4)
    # 5.25" Drive bays
    for y in [60, 130, 200]:
        draw.rectangle([100, y, 600, y + 50], fill=(35, 37, 42), outline=(75, 80, 88), width=2)
        draw.text((120, y + 16), "OPTICAL DRIVE BAY / BLANKING PLATE", fill=(80, 85, 95))
        
    # Power button & front I/O
    draw.ellipse([570, 280, 620, 330], fill=(70, 75, 85), outline=(100, 110, 125), width=2)
    draw.ellipse([585, 295, 605, 315], fill=(35, 40, 45))
    # USB ports
    for x in [450, 500]:
        draw.rectangle([x, 290, x + 35, 315], fill=(20, 22, 25), outline=(90, 95, 105))
        
    # Mold stamp >ABS<
    px, py = 180, 340
    draw.rectangle([px - 20, py - 15, px + 200, py + 70], outline=(40, 42, 48), width=2)
    draw.text((px + 2, py + 2), ">ABS<", fill=(25, 27, 30))
    draw.text((px - 1, py - 1), ">ABS<", fill=(95, 100, 112))
    draw.text((px, py), ">ABS<", fill=(60, 64, 72))
    draw.text((px, py + 35), "CHASSIS FRONT BEZEL", fill=(85, 90, 100))
    
    pc_np = np.array(img_pc)
    noise = np.random.normal(0, 3, pc_np.shape).astype(np.int16)
    pc_noisy = np.clip(pc_np + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(output_dir, "desktop_tower_abs.jpg"), cv2.cvtColor(pc_noisy, cv2.COLOR_RGB2BGR))
    
    # 5. Mechanical Keyboard Shell Underside (2018) - ABS (>ABS<)
    # Texture, cable channel, fold-out kickstands
    img_kb = Image.new("RGB", (700, 500), color=(38, 40, 44))
    draw = ImageDraw.Draw(img_kb)
    
    draw.rectangle([30, 40, 670, 460], outline=(60, 64, 72), width=3)
    # Cable routing channel
    draw.rectangle([320, 40, 380, 200], fill=(22, 24, 27), outline=(50, 55, 62))
    draw.line([30, 200, 670, 200], fill=(22, 24, 27), width=18)
    
    # Kickstand housings
    for kx in [80, 560]:
        draw.rectangle([kx, 70, kx + 60, 130], fill=(25, 27, 30), outline=(65, 70, 80), width=2)
        draw.text((kx + 8, 95), "FOOT", fill=(85, 90, 100))
        
    # Mold mark >ABS<
    kx, ky = 270, 300
    draw.rectangle([kx - 20, ky - 10, kx + 180, ky + 65], outline=(28, 30, 34), width=2)
    draw.text((kx + 2, ky + 2), ">ABS<", fill=(18, 20, 22))
    draw.text((kx - 1, ky - 1), ">ABS<", fill=(75, 80, 90))
    draw.text((kx, ky), ">ABS<", fill=(43, 46, 52))
    draw.text((kx, ky + 32), "KEYBOARD HOUSING LOWER", fill=(70, 75, 85))
    
    kb_np = np.array(img_kb)
    noise = np.random.normal(0, 3, kb_np.shape).astype(np.int16)
    kb_noisy = np.clip(kb_np + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(output_dir, "keyboard_shell_abs.jpg"), cv2.cvtColor(kb_noisy, cv2.COLOR_RGB2BGR))
    
    # 6. High-Contrast Mold Stamp Macro: >ABS-FR(40)< (RoHS Hazard Warning)
    # Close-up macro showing realistic relief lighting
    img_stamp1 = Image.new("RGB", (600, 400), color=(48, 51, 56))
    draw1 = ImageDraw.Draw(img_stamp1)
    
    # Molded textured plate background
    draw1.rectangle([20, 20, 580, 380], outline=(35, 38, 42), width=3)
    draw1.rectangle([50, 50, 550, 350], fill=(42, 45, 50), outline=(65, 70, 78), width=2)
    
    # Large embossed text with strong directional lighting (highlight top-left, shadow bottom-right)
    text = ">ABS-FR(40)<"
    # Strong shadow
    draw1.text((95, 145), text, fill=(15, 17, 20))
    draw1.text((94, 144), text, fill=(22, 24, 28))
    # Crisp highlight
    draw1.text((90, 138), text, fill=(110, 118, 130))
    draw1.text((91, 139), text, fill=(85, 92, 102))
    # Primary face
    draw1.text((92, 141), text, fill=(55, 60, 68))
    
    draw1.text((150, 240), "FLAME RETARDANT: BROMINATED + Sb2O3", fill=(95, 102, 115))
    draw1.text((190, 265), "ISO 11469 / ISO 1043-4", fill=(80, 86, 98))
    
    s1_np = np.array(img_stamp1)
    noise = np.random.normal(0, 4, s1_np.shape).astype(np.int16)
    s1_noisy = np.clip(s1_np + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(output_dir, "macro_stamp_abs_fr40.jpg"), cv2.cvtColor(s1_noisy, cv2.COLOR_RGB2BGR))
    
    # 7. Mold Stamp Macro: >PS-HI< (Clean HIPS sample)
    img_stamp2 = Image.new("RGB", (600, 400), color=(195, 192, 184))
    draw2 = ImageDraw.Draw(img_stamp2)
    draw2.rectangle([40, 40, 560, 360], fill=(185, 182, 174), outline=(215, 212, 204), width=3)
    
    t2 = ">PS-HI<"
    draw2.text((165, 150), t2, fill=(130, 126, 118))
    draw2.text((158, 140), t2, fill=(245, 242, 235))
    draw2.text((160, 143), t2, fill=(190, 186, 178))
    
    draw2.text((180, 240), "HIGH IMPACT POLYSTYRENE", fill=(130, 125, 118))
    draw2.text((210, 265), "ISO 11469 CODE", fill=(145, 140, 132))
    
    s2_np = np.array(img_stamp2)
    noise = np.random.normal(0, 3, s2_np.shape).astype(np.int16)
    s2_noisy = np.clip(s2_np + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(output_dir, "macro_stamp_ps_hi.jpg"), cv2.cvtColor(s2_noisy, cv2.COLOR_RGB2BGR))
    
    # 8. Server High-Temp Fan Shroud / Air Duct (2021) - Polycarbonate (>PC<)
    # Deep slate/black engineering polymer with reinforcement ribs
    img_pc_duct = Image.new("RGB", (700, 500), color=(28, 30, 34))
    draw_pc = ImageDraw.Draw(img_pc_duct)
    
    draw_pc.rectangle([30, 30, 670, 470], outline=(55, 60, 68), width=3)
    # Heavy diagonal structural ribs
    for i in range(50, 450, 40):
        draw_pc.line([60, i, 260, i + 80], fill=(42, 45, 52), width=4)
        draw_pc.line([440, i, 640, i + 80], fill=(42, 45, 52), width=4)
        
    # Flow direction arrow
    draw_pc.polygon([(350, 100), (380, 150), (360, 150), (360, 220), (340, 220), (340, 150), (320, 150)], fill=(80, 85, 95))
    draw_pc.text((315, 235), "AIRFLOW", fill=(95, 102, 115))
    
    # Mold stamp >PC<
    cx, cy = 290, 320
    draw_pc.rectangle([cx - 20, cy - 10, cx + 160, cy + 65], outline=(20, 22, 25), width=2)
    draw_pc.text((cx + 2, cy + 2), ">PC<", fill=(12, 14, 16))
    draw_pc.text((cx - 1, cy - 1), ">PC<", fill=(65, 72, 82))
    draw_pc.text((cx, cy), ">PC<", fill=(35, 38, 44))
    draw_pc.text((cx - 10, cy + 32), "HEAT RESISTANT TG 147C", fill=(60, 65, 75))
    
    duct_np = np.array(img_pc_duct)
    noise = np.random.normal(0, 3, duct_np.shape).astype(np.int16)
    duct_noisy = np.clip(duct_np + noise, 0, 255).astype(np.uint8)
    cv2.imwrite(os.path.join(output_dir, "server_duct_pc.jpg"), cv2.cvtColor(duct_noisy, cv2.COLOR_RGB2BGR))
    
    print(f"Generated 8 realistic e-waste sample images in {output_dir}/")

if __name__ == "__main__":
    create_synthetic_samples()
