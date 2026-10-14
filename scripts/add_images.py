"""
add_images.py — Dataset Ingestion & Splitter Helper for ReForm
=============================================================
Quickly add new images of e-waste devices into ReForm's dataset structure.
Automatically validates images, cleans names, and splits 70% train / 15% val / 15% test.

Usage Examples:
---------------
1. Add new images from an input folder into a device category:
   python add_images.py --source "C:/path/to/my_keyboards" --device "keyboard"

2. Add a new plastic device class (e.g. router):
   python add_images.py --source "C:/path/to/my_routers" --device "router" --is-plastic

3. Check current dataset counts:
   python add_images.py --status
"""

import argparse
import random
import shutil
import sys
from pathlib import Path
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent if Path(__file__).resolve().parent.name == "scripts" else Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
STAGE0_DIR = DATA_DIR / "stage0"
STAGE1_DIR = DATA_DIR / "stage1"

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

STAGE1_KNOWN_DEVICES = [
    "keyboard", "mouse", "printer_casing", "tv_panel", "remote", "other_plastic", "unknown"
]


def print_status():
    print("\n" + "=" * 65)
    print(" [DATASET SUMMARY] Current ReForm Image Counts")
    print("=" * 65)
    for stage_name, stage_path in [("Stage 0 (Material Sorter)", STAGE0_DIR), ("Stage 1 (Device / Item Sorter)", STAGE1_DIR)]:
        print(f"\n--- {stage_name} ---")
        if not stage_path.exists():
            print(f"  [MISSING] {stage_path}")
            continue
        for split in ["train", "val", "test"]:
            sp = stage_path / split
            if not sp.exists():
                print(f"  [{split}]: Folder missing")
                continue
            counts = {d.name: len([f for f in d.iterdir() if f.suffix.lower() in VALID_EXTENSIONS]) for d in sorted(sp.iterdir()) if d.is_dir()}
            total = sum(counts.values())
            print(f"  {split:<6} (total: {total:<5}) -> {counts}")
    print("=" * 65 + "\n")


def ingest_images(source_dir: Path, device_name: str, is_plastic: bool = True, train_pct: float = 0.70, val_pct: float = 0.15):
    source_dir = Path(source_dir).resolve()
    if not source_dir.exists() or not source_dir.is_dir():
        print(f"[ERROR] Source folder not found: {source_dir}")
        sys.exit(1)

    # Find valid images
    candidates = [f for f in source_dir.iterdir() if f.is_file() and f.suffix.lower() in VALID_EXTENSIONS]
    if not candidates:
        print(f"[ERROR] No valid images ({', '.join(VALID_EXTENSIONS)}) found in {source_dir}")
        sys.exit(1)

    print(f"[INFO] Found {len(candidates)} candidate images in {source_dir.name}")

    # Validate image readability with PIL
    valid_images = []
    for f in candidates:
        try:
            with Image.open(f) as img:
                img.verify()
            valid_images.append(f)
        except Exception as e:
            print(f"  [SKIP] Corrupt or unreadable image {f.name}: {e}")

    if not valid_images:
        print("[ERROR] None of the candidate images could be verified.")
        sys.exit(1)

    # Shuffle for random split
    random.seed(42)
    random.shuffle(valid_images)

    total = len(valid_images)
    n_train = int(total * train_pct)
    n_val = int(total * val_pct)
    # Remaining go to test
    splits = {
        "train": valid_images[:n_train],
        "val": valid_images[n_train:n_train + n_val],
        "test": valid_images[n_train + n_val:]
    }

    print(f"[INFO] Split plan: {len(splits['train'])} train, {len(splits['val'])} val, {len(splits['test'])} test")

    copied_s1 = 0
    copied_s0 = 0

    clean_device = device_name.strip().lower().replace(" ", "_")

    for split_name, img_list in splits.items():
        # Destination in Stage 1
        s1_target_dir = STAGE1_DIR / split_name / clean_device
        s1_target_dir.mkdir(parents=True, exist_ok=True)

        # Destination in Stage 0 (if plastic, goes to 'plastic')
        s0_target_dir = STAGE0_DIR / split_name / ("plastic" if is_plastic else "unknown")
        s0_target_dir.mkdir(parents=True, exist_ok=True)

        for i, src_file in enumerate(img_list):
            file_stem = f"{clean_device}_{src_file.stem}_{random.randint(1000, 9999)}{src_file.suffix.lower()}"
            
            # Copy to Stage 1
            dest1 = s1_target_dir / file_stem
            shutil.copy2(src_file, dest1)
            copied_s1 += 1

            # Also mirror into Stage 0 so Stage 0 learns the material
            dest0 = s0_target_dir / file_stem
            shutil.copy2(src_file, dest0)
            copied_s0 += 1

    print(f"\n[SUCCESS] Successfully ingested {len(valid_images)} images:")
    print(f"  -> Added {copied_s1} images to data/stage1/*/{clean_device}")
    if is_plastic:
        print(f"  -> Added {copied_s0} images to data/stage0/*/plastic (mirrored)")
    
    print_status()


def main():
    parser = argparse.ArgumentParser(description="ReForm Image Ingestion & Dataset Splitter")
    parser.add_argument("--source", type=str, help="Path to folder containing raw images to add")
    parser.add_argument("--device", type=str, help="Device class name (e.g. keyboard, mouse, remote, printer_casing, tv_panel, other_plastic)")
    parser.add_argument("--is-plastic", action="store_true", default=True, help="Whether this device is plastic (mirrors into stage0/plastic). Default: True")
    parser.add_argument("--status", action="store_true", help="Print current dataset class distribution")

    args = parser.parse_args()

    if args.status or (not args.source and not args.device):
        print_status()
        return

    if not args.source or not args.device:
        print("[ERROR] Both --source and --device are required. Example:\n  python add_images.py --source my_images/keyboards --device keyboard")
        sys.exit(1)

    ingest_images(Path(args.source), args.device, is_plastic=args.is_plastic)


if __name__ == "__main__":
    main()
