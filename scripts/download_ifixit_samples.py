"""
Download curated, studio-quality e-waste teardown photos from iFixit's official CDN.
Replaces generic/scraped photos with high-resolution, focused e-waste casing and stamp photographs.
"""
import os

import requests
from PIL import Image

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

CURATED_IFIXIT_CATALOG = [
    {
        "filename": "ifixit_crt_rear_housing.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/ymvgwZjIRXyyDOxq.large",
        "title": "Vintage CRT Rear Plastic Housing (Vents, High BFR Hazard)",
        "appliance": "crt_housing",
        "polymer": "ABS-FR(40)",
        "stamp": ">ABS-FR(40)<",
        "bfr_base": 0.85
    },
    {
        "filename": "ifixit_casing_mold_relief.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/1GLFJMUyGekPABkb.large",
        "title": "Macro: Interior Casing Tooling Mold Marks & Reliefs",
        "appliance": "crt_housing",
        "polymer": "ABS",
        "stamp": ">ABS<",
        "bfr_base": 0.20
    },
    {
        "filename": "ifixit_printer_side_panel.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/cnqfrhqlUNXugKAU.large",
        "title": "Laser Printer Side Cover Panel (HP LaserJet 1320, HIPS)",
        "appliance": "laser_printer",
        "polymer": "HIPS",
        "stamp": ">PS-HI<",
        "bfr_base": 0.50
    },
    {
        "filename": "ifixit_printer_rear_vents.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/xSOfDT4Z2uiyrG22.large",
        "title": "Laser Printer Rear Housing Panel with Cooling Vents",
        "appliance": "laser_printer",
        "polymer": "HIPS",
        "stamp": ">PS-HI<",
        "bfr_base": 0.50
    },
    {
        "filename": "ifixit_thinkpad_bottom_cover.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/ZsEjfBcyXGiNjl35.large",
        "title": "IBM ThinkPad T42 Bottom Shell (>PC+ABS< Alloy Casing)",
        "appliance": "flat_display",
        "polymer": "PC-ABS",
        "stamp": ">PC+ABS<",
        "bfr_base": 0.15
    },
    {
        "filename": "ifixit_thinkpad_memory_door.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/EIXFqKKCm32Nabb5.large",
        "title": "ThinkPad Casing Door & Molded Regulatory Standoffs",
        "appliance": "flat_display",
        "polymer": "PC-ABS",
        "stamp": ">PC+ABS<",
        "bfr_base": 0.08
    },
    {
        "filename": "ifixit_xbox360_abs_shell.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/AxyTCOdjOIEOxRQO.large",
        "title": "Xbox 360 Main Bottom Outer ABS Plastic Shell",
        "appliance": "desktop_chassis",
        "polymer": "ABS",
        "stamp": ">ABS<",
        "bfr_base": 0.25
    },
    {
        "filename": "ifixit_xbox360_faceplate.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/mpUPHJteXKlkP3lj.large",
        "title": "Xbox 360 Front Bezel Faceplate (Molded Neat ABS)",
        "appliance": "desktop_chassis",
        "polymer": "ABS",
        "stamp": ">ABS<",
        "bfr_base": 0.10
    },
    {
        "filename": "ifixit_ps4_chassis_casing.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/dDYvvDDxMMI6pcFk.large",
        "title": "PlayStation 4 Geometric PC-ABS Outer Enclosure",
        "appliance": "desktop_chassis",
        "polymer": "PC-ABS",
        "stamp": ">PC+ABS<",
        "bfr_base": 0.12
    },
    {
        "filename": "ifixit_keyboard_bottom_shell.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/maa2ycVVorjwdNHb.large",
        "title": "Keyboard Underside Plastic Shell & Molded Markings",
        "appliance": "keyboard_casing",
        "polymer": "ABS",
        "stamp": ">ABS<",
        "bfr_base": 0.04
    },
    {
        "filename": "ifixit_router_vented_casing.jpg",
        "url": "https://guide-images.cdn.ifixit.com/igi/PkylmsCvivFvqZfv.large",
        "title": "Netgear Nighthawk Router Vented Bottom Shell (ABS)",
        "appliance": "keyboard_casing",
        "polymer": "ABS",
        "stamp": ">ABS<",
        "bfr_base": 0.04
    }
]

def clean_old_generic_samples(target_dir="sample_images"):
    # List of generic downloaded samples to delete
    generic_to_remove = [
        "real_crt_monitor_back.jpg",
        "real_crt_monitor_rear.jpg",
        "real_ewaste_monitors_heap.jpg",
        "real_ewaste_pile.jpg",
        "real_keyboard_casing.jpg",
        "real_plastic_resin_stamp.jpg",
        "real_laptop_chassis_bottom.jpg",
        "real_printer_door_panel.jpg"
    ]
    for fn in generic_to_remove:
        fp = os.path.join(target_dir, fn)
        if os.path.exists(fp):
            try:
                os.remove(fp)
                print(f"Removed previous generic file: {fn}")
            except OSError as e:
                print(f"Could not remove {fn}: {e}")

DEFAULT_OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_images"))

def download_curated_ifixit(output_dir=None):
    if output_dir is None:
        output_dir = DEFAULT_OUTPUT_DIR
    os.makedirs(output_dir, exist_ok=True)
    clean_old_generic_samples(output_dir)

    print("\nDownloading 11 curated, studio-grade teardown photos from iFixit CDN...")
    downloaded = 0
    for item in CURATED_IFIXIT_CATALOG:
        target_path = os.path.join(output_dir, item["filename"])
        try:
            r = requests.get(item["url"], headers=HEADERS, timeout=12)
            if r.status_code == 200 and len(r.content) > 5000:
                with open(target_path, "wb") as f:
                    f.write(r.content)
                im = Image.open(target_path)
                print(f"[SUCCESS] {item['filename']} -> Dimensions: {im.size}, Format: {im.format}, Size: {len(r.content):,} bytes")
                downloaded += 1
            else:
                print(f"[FAILED] HTTP {r.status_code} for {item['filename']}")
        except (OSError, requests.RequestException) as e:
            print(f"[ERROR] {item['filename']}: {e}")
            
    print(f"\nCompleted: {downloaded} / {len(CURATED_IFIXIT_CATALOG)} curated iFixit images downloaded successfully.")

if __name__ == "__main__":
    download_curated_ifixit()
