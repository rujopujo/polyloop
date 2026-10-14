"""
download_datasets.py
Downloads e-waste datasets from Kaggle and organises them into the
train/val/test folder structure expected by train.ipynb.

Run with:
    conda activate reform
    python download_datasets.py
"""

import os
import sys
import json
import shutil
import random
import zipfile
from pathlib import Path

# ── Auth ──────────────────────────────────────────────────────────────────────
os.environ["KAGGLE_USERNAME"] = "lancer9819"
os.environ["KAGGLE_KEY"]      = "19a17c62f4a9bd61b7a0873b4448f8d1"

from kaggle.api.kaggle_api_extended import KaggleApi

api = KaggleApi()
api.authenticate()
print("Kaggle auth OK")

# ── Paths ─────────────────────────────────────────────────────────────────────
PROJECT  = Path(__file__).resolve().parent.parent if Path(__file__).resolve().parent.name == "scripts" else Path(__file__).resolve().parent
TEMP     = PROJECT / "temp_datasets"
DATA     = PROJECT / "data"
TEMP.mkdir(exist_ok=True)

SEED = 42
random.seed(SEED)

# ── Stage class names (folder names) ─────────────────────────────────────────
STAGE0_CLASSES = ["plastic", "metal", "PCB", "glass_screen",
                  "cable_wire", "battery", "unknown"]
STAGE1_CLASSES = ["keyboard", "mouse", "charger_casing", "printer_casing",
                  "tv_panel", "remote", "other_plastic", "unknown"]

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def make_split_dirs(stage: str, classes: list):
    for split in ["train", "val", "test"]:
        for cls in classes:
            (DATA / stage / split / cls).mkdir(parents=True, exist_ok=True)


def collect_images(folder: Path) -> list:
    """Recursively collect all image paths under folder."""
    return [p for p in folder.rglob("*") if p.suffix.lower() in IMG_EXTS]


def split_and_copy(images: list, dst_class_dir: Path, train=0.70, val=0.15):
    """
    Shuffle and split a list of image paths into train/val/test,
    copying them into dst_class_dir's parent structure.

    dst_class_dir is e.g. data/stage0/train/plastic  — we derive
    data/stage0/val/plastic and data/stage0/test/plastic from it.
    """
    random.shuffle(images)
    n       = len(images)
    n_train = int(n * train)
    n_val   = int(n * val)

    splits = {
        "train": images[:n_train],
        "val":   images[n_train:n_train + n_val],
        "test":  images[n_train + n_val:],
    }

    class_name = dst_class_dir.name
    stage_dir  = dst_class_dir.parent.parent   # e.g. data/stage0

    copied = 0
    for split, imgs in splits.items():
        dest = stage_dir / split / class_name
        dest.mkdir(parents=True, exist_ok=True)
        for i, src in enumerate(imgs):
            ext     = src.suffix.lower()
            dst_file = dest / f"{class_name}_{split}_{i:04d}{ext}"
            shutil.copy2(src, dst_file)
            copied += 1

    print(f"    {class_name}: {n} images → "
          f"train={len(splits['train'])} val={len(splits['val'])} test={len(splits['test'])}")
    return copied


# ─────────────────────────────────────────────────────────────────────────────
# DOWNLOAD
# ─────────────────────────────────────────────────────────────────────────────

datasets = [
    ("humansintheloop/e-waste-image-dataset",        "humansintheloop"),
    ("akshaymishra32/e-waste-detection",             "akshaymishra"),
    ("dhruvkothari19/ewaste",                        "dhruvkothari"),
    ("mostafaabla/garbage-classification",           "garbage_class"),
    ("asdasdasasdas/recyclable-waste-classification","recyclable"),   # fallback
]

downloaded = []
for slug, name in datasets:
    dest = TEMP / name
    if dest.exists() and any(dest.rglob("*")):
        print(f"Already downloaded: {name}")
        downloaded.append((slug, name, dest))
        continue
    dest.mkdir(exist_ok=True)
    try:
        print(f"Downloading {slug} ...")
        api.dataset_download_files(slug, path=str(dest), unzip=True, quiet=False)
        downloaded.append((slug, name, dest))
        print(f"  OK → {dest}")
    except Exception as e:
        print(f"  SKIP {slug}: {e}")

print(f"\nDownloaded {len(downloaded)} dataset(s).")

# ─────────────────────────────────────────────────────────────────────────────
# INSPECT — show what folders / class names exist in each dataset
# ─────────────────────────────────────────────────────────────────────────────

print("\n── Dataset contents ──")
for slug, name, dest in downloaded:
    print(f"\n{name} ({dest}):")
    for item in sorted(dest.rglob("*"))[:40]:
        if item.is_dir():
            imgs = list(item.glob("*"))
            img_count = sum(1 for f in imgs if f.suffix.lower() in IMG_EXTS)
            if img_count > 0:
                print(f"  DIR  {item.relative_to(dest)}  ({img_count} images)")

# ─────────────────────────────────────────────────────────────────────────────
# MAPPING — source folder → our class name
# Adjust these mappings after inspecting the output above.
# ─────────────────────────────────────────────────────────────────────────────

# Maps (dataset_name, source_folder_name_lowercase) → our stage0 or stage1 class
# We do case-insensitive substring matching on the source folder name.

STAGE0_MAP = {
    # keywords that appear in source folder names → our Stage 0 class
    "plastic"       : "plastic",
    "keyboard"      : "plastic",   # keyboards are plastic items
    "mouse"         : "plastic",
    "printer"       : "plastic",
    "monitor"       : "plastic",
    "laptop"        : "plastic",
    "crt"           : "plastic",
    "desktop"       : "plastic",
    "router"        : "plastic",
    "settopbox"     : "plastic",
    "set_top"       : "plastic",
    "tablet"        : "plastic",
    "ups"           : "plastic",
    "mobile"        : "plastic",
    "phone"         : "plastic",
    "tv"            : "plastic",
    "remote"        : "plastic",
    "metal"         : "metal",
    "pcb"           : "PCB",
    "circuit"       : "PCB",
    "board"         : "PCB",
    "glass"         : "glass_screen",
    "screen"        : "glass_screen",
    "display"       : "glass_screen",
    "cable"         : "cable_wire",
    "wire"          : "cable_wire",
    "battery"       : "battery",
    "trash"         : "unknown",
    "other"         : "unknown",
    "unknown"       : "unknown",
    "non"           : "unknown",
    "garbage"       : "unknown",
    "paper"         : "unknown",
    "cardboard"     : "unknown",
    "organic"       : "unknown",
    "clothes"       : "unknown",
    "shoes"         : "unknown",
    "food"          : "unknown",
    "wood"          : "unknown",
}

STAGE1_MAP = {
    "keyboard"      : "keyboard",
    "mouse"         : "mouse",
    "charger"       : "charger_casing",
    "adapter"       : "charger_casing",
    "printer"       : "printer_casing",
    "tv"            : "tv_panel",
    "crt"           : "tv_panel",
    "monitor"       : "tv_panel",
    "remote"        : "remote",
    "laptop"        : "other_plastic",
    "mobile"        : "other_plastic",
    "phone"         : "other_plastic",
    "router"        : "other_plastic",
    "desktop"       : "other_plastic",
    "tablet"        : "other_plastic",
    "settopbox"     : "other_plastic",
    "set_top"       : "other_plastic",
    "ups"           : "other_plastic",
    "trash"         : "unknown",
    "other"         : "unknown",
    "unknown"       : "unknown",
    "garbage"       : "unknown",
    "paper"         : "unknown",
    "cardboard"     : "unknown",
    "organic"       : "unknown",
    "clothes"       : "unknown",
    "metal"         : "unknown",   # non-plastic → unknown for stage1
    "glass"         : "unknown",
    "cable"         : "unknown",
    "battery"       : "unknown",
}

def map_folder(folder_name: str, mapping: dict) -> str | None:
    """Return the target class for a source folder name, or None if no match."""
    fn = folder_name.lower().replace("-", "").replace("_", "").replace(" ", "")
    for keyword, cls in mapping.items():
        kw = keyword.replace("_", "").replace("-", "").replace(" ", "")
        if kw in fn:
            return cls
    return None

# ─────────────────────────────────────────────────────────────────────────────
# ORGANISE — copy images into data/stage0/ and data/stage1/
# ─────────────────────────────────────────────────────────────────────────────

make_split_dirs("stage0", STAGE0_CLASSES)
make_split_dirs("stage1", STAGE1_CLASSES)

# Collect (source_folder, images) pairs from all downloaded datasets
source_folders = []
for slug, name, dest in downloaded:
    for folder in sorted(dest.rglob("*")):
        if not folder.is_dir():
            continue
        imgs = [f for f in folder.iterdir() if f.suffix.lower() in IMG_EXTS]
        if len(imgs) >= 10:   # skip near-empty folders
            source_folders.append((folder, imgs))

print(f"\nFound {len(source_folders)} source folders with images.")

# Target counts — "Good" column from the dataset guide
STAGE0_TARGET = {
    "plastic":      500,
    "metal":        400,
    "PCB":          400,
    "glass_screen": 300,
    "cable_wire":   300,
    "battery":      300,
    "unknown":      400,
}
STAGE1_TARGET = {
    "keyboard":       300,
    "mouse":          300,
    "charger_casing": 250,
    "printer_casing": 250,
    "tv_panel":       250,
    "remote":         300,
    "other_plastic":  250,
    "unknown":        300,
}

# Buckets: collect images per class before splitting
stage0_buckets = {c: [] for c in STAGE0_CLASSES}
stage1_buckets = {c: [] for c in STAGE1_CLASSES}

for folder, imgs in source_folders:
    folder_name = folder.name

    s0_class = map_folder(folder_name, STAGE0_MAP)
    s1_class = map_folder(folder_name, STAGE1_MAP)

    if s0_class:
        stage0_buckets[s0_class].extend(imgs)
    if s1_class:
        stage1_buckets[s1_class].extend(imgs)

# Deduplicate within each bucket (same file may appear in multiple datasets)
for cls in stage0_buckets:
    seen = set()
    unique = []
    for p in stage0_buckets[cls]:
        key = (p.stat().st_size, p.name)
        if key not in seen:
            seen.add(key)
            unique.append(p)
    stage0_buckets[cls] = unique

for cls in stage1_buckets:
    seen = set()
    unique = []
    for p in stage1_buckets[cls]:
        key = (p.stat().st_size, p.name)
        if key not in seen:
            seen.add(key)
            unique.append(p)
    stage1_buckets[cls] = unique

# Cap at target counts and split
print("\n── Stage 0 organisation ──")
total_s0 = 0
for cls in STAGE0_CLASSES:
    imgs = stage0_buckets[cls]
    random.shuffle(imgs)
    imgs = imgs[:STAGE0_TARGET[cls]]   # cap at target
    if not imgs:
        print(f"  WARNING: no images found for stage0/{cls}")
        continue
    total_s0 += split_and_copy(imgs, DATA / "stage0" / "train" / cls)

print("\n── Stage 1 organisation ──")
total_s1 = 0
for cls in STAGE1_CLASSES:
    imgs = stage1_buckets[cls]
    random.shuffle(imgs)
    imgs = imgs[:STAGE1_TARGET[cls]]
    if not imgs:
        print(f"  WARNING: no images found for stage1/{cls}")
        continue
    total_s1 += split_and_copy(imgs, DATA / "stage1" / "train" / cls)

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────

print("\n── Final image counts ──")
for stage in ["stage0", "stage1"]:
    print(f"\n{stage}:")
    for split in ["train", "val", "test"]:
        split_dir = DATA / stage / split
        if not split_dir.exists():
            continue
        counts = {}
        for cls_dir in sorted(split_dir.iterdir()):
            if cls_dir.is_dir():
                n = sum(1 for f in cls_dir.iterdir() if f.suffix.lower() in IMG_EXTS)
                counts[cls_dir.name] = n
        total = sum(counts.values())
        print(f"  [{split}] total={total}  " +
              "  ".join(f"{c}:{n}" for c, n in counts.items()))

print("\nDone. You can now upload data/ to Google Drive and run train.ipynb on Colab.")

# Save a summary JSON for reference
summary = {}
for stage, classes in [("stage0", STAGE0_CLASSES), ("stage1", STAGE1_CLASSES)]:
    summary[stage] = {}
    for split in ["train", "val", "test"]:
        summary[stage][split] = {}
        for cls in classes:
            d = DATA / stage / split / cls
            if d.exists():
                summary[stage][split][cls] = sum(
                    1 for f in d.iterdir() if f.suffix.lower() in IMG_EXTS
                )
with open(DATA / "dataset_summary.json", "w") as f:
    json.dump(summary, f, indent=2)
print("Summary saved to data/dataset_summary.json")
