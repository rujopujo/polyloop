"""Synthetic test stamp sample generator using OpenCV."""

import os
from pathlib import Path

import cv2
import numpy as np


def create_synthetic_casing_stamp(
    text: str,
    output_path: Path,
    bg_color: int = 40,
    engrave_depth: int = 25,
    noise_sigma: int = 8,
    width: int = 640,
    height: int = 480
):
    """Generate a realistic plastic casing surface with embossed mold lettering."""
    # 1. Base plastic background with slight gradient
    base = np.full((height, width), bg_color, dtype=np.uint8)

    # 2. Add subtle plastic surface noise/grain
    noise = np.random.normal(0, noise_sigma, (height, width)).astype(np.int16)
    casing = np.clip(base.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # 3. Simulate low-profile embossed text (light edge on top-left, shadow on bottom-right)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 1.8
    thickness = 4
    text_size, _ = cv2.getTextSize(text, font, font_scale, thickness)
    tx = (width - text_size[0]) // 2
    ty = (height + text_size[1]) // 2

    # Draw bottom-right shadow (depressed groove)
    shadow_color = max(0, bg_color - engrave_depth)
    cv2.putText(casing, text, (tx + 2, ty + 2), font, font_scale, (shadow_color,), thickness, cv2.LINE_AA)

    # Draw top-left highlight (molding relief specular reflection)
    highlight_color = min(255, bg_color + engrave_depth)
    cv2.putText(casing, text, (tx - 1, ty - 1), font, font_scale, (highlight_color,), thickness, cv2.LINE_AA)

    # Draw main groove body
    body_color = max(0, bg_color - (engrave_depth // 2))
    cv2.putText(casing, text, (tx, ty), font, font_scale, (body_color,), thickness, cv2.LINE_AA)

    # 4. Convert to 3-channel BGR
    casing_bgr = cv2.cvtColor(casing, cv2.COLOR_GRAY2BGR)

    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), casing_bgr)
    return output_path


def generate_all_samples(target_dir: Path):
    """Generate a comprehensive set of test stamp images."""
    samples = [
        (">ABS<", "keyboard_abs_stamp.png", 50),
        (">PS-HI<", "crt_hips_stamp.png", 35),
        (">PC+ABS<", "laptop_pcabs_stamp.png", 45),
        (">ABS-FR(40)<", "hazardous_crt_fr40_stamp.png", 30),
        (">PC<", "monitor_pc_stamp.png", 40)
    ]

    generated_files = []
    for text, filename, bg_val in samples:
        filepath = target_dir / filename
        create_synthetic_casing_stamp(text, filepath, bg_color=bg_val)
        generated_files.append(filepath)

    return generated_files


if __name__ == "__main__":
    current_dir = Path(__file__).resolve().parent
    stamps_dir = current_dir / "test_stamps"
    generated = generate_all_samples(stamps_dir)
    print(f"Generated {len(generated)} synthetic samples in {stamps_dir}")
