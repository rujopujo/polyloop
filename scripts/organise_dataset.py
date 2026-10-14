# organise_dataset.py
# Converts the Roboflow "E-Waste Detector" folder dataset into the
# train / val / test structure expected by train.ipynb.
#
# Source:  C:/Users/iomth/Desktop/E-Waste Detector.v1i.folder/
# Target:  G:/clg/ReForm/data/
#
# Mapping:
#   Stage 0 (material sorter):
#     plastic      <- Keyboard, Mouse, Microwave, Mobile, Player, Printer,
#                     Television, Washing Machine, plastic
#     metal        <- metal
#     PCB          <- PCB
#     glass_screen <- glass
#     battery      <- Battery
#     unknown      <- cardboard, organic, paper, trash
#
#   Stage 1 (item classifier, plastic items only):
#     keyboard        <- Keyboard
#     mouse           <- Mouse
#     printer_casing  <- Printer
#     tv_panel        <- Television
#     remote          <- Player
#     other_plastic   <- Microwave, Mobile, Washing Machine, plastic
#     unknown         <- everything non-plastic

import os
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent if Path(__file__).resolve().parent.name == "scripts" else Path(__file__).resolve().parent
SRC  = Path(r"C:\Users\iomth\Desktop\E-Waste Detector.v1i.folder")
DST  = PROJECT_ROOT / "data"
EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Source split names → our split names
SPLIT_MAP = {
    "train": "train",
    "valid": "val",
    "test":  "test",
}

# ── Mappings (lowercase source class → our class) ────────────────────────────

STAGE0_MAP = {
    "keyboard":       "plastic",
    "mouse":          "plastic",
    "microwave":      "plastic",
    "mobile":         "plastic",
    "player":         "plastic",
    "printer":        "plastic",
    "television":     "plastic",
    "washing machine":"plastic",
    "plastic":        "plastic",
    "metal":          "metal",
    "pcb":            "PCB",
    "glass":          "glass_screen",
    "battery":        "battery",
    "cardboard":      "unknown",
    "organic":        "unknown",
    "paper":          "unknown",
    "trash":          "unknown",
}

STAGE1_MAP = {
    "keyboard":        "keyboard",
    "mouse":           "mouse",
    "printer":         "printer_casing",
    "television":      "tv_panel",
    "player":          "remote",
    "microwave":       "other_plastic",
    "mobile":          "other_plastic",
    "washing machine": "other_plastic",
    "plastic":         "other_plastic",
    # Non-plastic items go into unknown so Stage 1 has a reject class
    "metal":           "unknown",
    "pcb":             "unknown",
    "glass":           "unknown",
    "battery":         "unknown",
    "cardboard":       "unknown",
    "organic":         "unknown",
    "paper":           "unknown",
    "trash":           "unknown",
}

# ── Create destination folders ────────────────────────────────────────────────

STAGE0_CLASSES = ["plastic", "metal", "PCB", "glass_screen",
                  "cable_wire", "battery", "unknown"]
STAGE1_CLASSES = ["keyboard", "mouse", "charger_casing", "printer_casing",
                  "tv_panel", "remote", "other_plastic", "unknown"]

for stage, classes in [("stage0", STAGE0_CLASSES), ("stage1", STAGE1_CLASSES)]:
    for split in ["train", "val", "test"]:
        for cls in classes:
            (DST / stage / split / cls).mkdir(parents=True, exist_ok=True)

# ── Copy images ───────────────────────────────────────────────────────────────

counters = {"stage0": {}, "stage1": {}}

for src_split, dst_split in SPLIT_MAP.items():
    split_dir = SRC / src_split
    if not split_dir.exists():
        print(f"  split not found: {split_dir}")
        continue

    for class_dir in sorted(split_dir.iterdir()):
        if not class_dir.is_dir():
            continue

        src_class = class_dir.name.lower()

        # Resolve destination classes
        s0_cls = STAGE0_MAP.get(src_class)
        s1_cls = STAGE1_MAP.get(src_class)

        images = [f for f in class_dir.iterdir() if f.suffix.lower() in EXTS]

        for stage, dst_cls, mapping in [
            ("stage0", s0_cls, STAGE0_MAP),
            ("stage1", s1_cls, STAGE1_MAP),
        ]:
            if dst_cls is None:
                continue

            dst_dir = DST / stage / dst_split / dst_cls
            key = f"{stage}/{dst_split}/{dst_cls}"
            counters[stage].setdefault(dst_cls, 0)

            for img in images:
                # Unique name: original class + original filename
                new_name = f"{src_class}_{img.name}"
                dst_file = dst_dir / new_name
                # Avoid overwriting if same filename from different source classes
                if dst_file.exists():
                    stem = img.stem
                    ext  = img.suffix.lower()
                    i = 1
                    while dst_file.exists():
                        dst_file = dst_dir / f"{src_class}_{stem}_{i}{ext}"
                        i += 1
                shutil.copy2(img, dst_file)
                counters[stage][dst_cls] = counters[stage].get(dst_cls, 0) + 1

# ── Print summary ─────────────────────────────────────────────────────────────

print("\n── Stage 0 final counts ──")
for stage in ["stage0", "stage1"]:
    print(f"\n{stage}:")
    for split in ["train", "val", "test"]:
        split_dir = DST / stage / split
        row = {}
        for cls_dir in sorted(split_dir.iterdir()):
            if cls_dir.is_dir():
                n = sum(1 for f in cls_dir.iterdir() if f.suffix.lower() in EXTS)
                row[cls_dir.name] = n
        total = sum(row.values())
        print(f"  [{split}] total={total}  " +
              "  ".join(f"{c}:{n}" for c, n in row.items()))

print("\nDone. Dataset is ready in G:\\clg\\ReForm\\data\\")
