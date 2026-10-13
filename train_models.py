"""
train_models.py — MobileNetV2 Dual-Stage Transfer Learning Trainer
==================================================================
Train Stage 0 (Material Sorter) or Stage 1 (Device / Item Classifier)
using MobileNetV2 transfer learning on your local GPU/CPU.

Usage:
------
1. Train Stage 1 (Device Classifier - keyboard, mouse, remote, tv_panel, etc.):
   python train_models.py --stage 1

2. Train Stage 0 (Material Sorter - plastic, metal, PCB, battery, glass, unknown):
   python train_models.py --stage 0

3. Train both stages sequentially:
   python train_models.py --stage all

4. Quick test / dry-run with 1 epoch each:
   python train_models.py --stage 1 --epochs-head 1 --epochs-fine 1
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Silence noisy TF C++ logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import numpy as np
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mnv2_preprocess
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent.resolve()
DATA_DIR     = PROJECT_ROOT / "data"
MODELS_DIR   = PROJECT_ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

IMG_SIZE       = 224
DEFAULT_BATCH  = 32
DEFAULT_HEAD_EP = 15
DEFAULT_FINE_EP = 10
FINE_TUNE_LAYERS = 30
LR_HEAD        = 1e-3
LR_FINE        = 1e-5
DROPOUT        = 0.4
SEED           = 42


def check_gpu():
    gpus = tf.config.list_physical_devices("GPU")
    if gpus:
        print(f"[INFO] Hardware accelerator detected: {len(gpus)} GPU(s) available -> {gpus[0].name}")
    else:
        print("[INFO] Running on CPU (no CUDA GPU detected by TensorFlow).")


def make_generators(stage_dir: Path, batch_size: int = DEFAULT_BATCH):
    train_dir = stage_dir / "train"
    val_dir   = stage_dir / "val"
    test_dir  = stage_dir / "test"

    if not train_dir.exists() or not val_dir.exists():
        raise FileNotFoundError(f"Missing train or val directory inside {stage_dir}")

    # Data augmentation for training
    train_datagen = ImageDataGenerator(
        preprocessing_function=mnv2_preprocess,
        rotation_range=20,
        horizontal_flip=True,
        brightness_range=[0.7, 1.3],
        zoom_range=0.15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        fill_mode="nearest",
    )

    # Clean evaluation generator for val/test (no random transformations)
    eval_datagen = ImageDataGenerator(preprocessing_function=mnv2_preprocess)

    train_gen = train_datagen.flow_from_directory(
        str(train_dir),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=True,
        seed=SEED,
    )

    val_gen = eval_datagen.flow_from_directory(
        str(val_dir),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False,
        seed=SEED,
    )

    test_gen = None
    if test_dir.exists():
        test_gen = eval_datagen.flow_from_directory(
            str(test_dir),
            target_size=(IMG_SIZE, IMG_SIZE),
            batch_size=batch_size,
            class_mode="categorical",
            shuffle=False,
            seed=SEED,
        )

    class_names = list(train_gen.class_indices.keys())
    print(f"  Classes ({len(class_names)}): {class_names}")
    print(f"  Samples: train={train_gen.n}, val={val_gen.n}" + (f", test={test_gen.n}" if test_gen else ""))

    # Compute balanced class weights for imbalanced training sets
    classes_array = np.unique(train_gen.classes)
    weights = compute_class_weight("balanced", classes=classes_array, y=train_gen.classes)
    class_weights = dict(enumerate(weights))
    print(f"  Class weights: {{ {', '.join(f'{class_names[k]}: {round(v, 2)}' for k, v in class_weights.items())} }}")

    return train_gen, val_gen, test_gen, class_names, class_weights


def build_model(num_classes: int):
    inp = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3), name="input_image")
    base = MobileNetV2(include_top=False, weights="imagenet", input_tensor=inp)
    base.trainable = False

    x = layers.GlobalAveragePooling2D(name="gap")(base.output)
    x = layers.Dropout(DROPOUT, name="dropout")(x)
    out = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = Model(inp, out, name="reform_mobilenetv2")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LR_HEAD),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model, base


def enable_fine_tuning(model: Model, base: Model, num_layers: int = FINE_TUNE_LAYERS):
    base.trainable = True
    for layer in base.layers[:-num_layers]:
        layer.trainable = False
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LR_FINE),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )
    unfrozen = sum(1 for l in base.layers if l.trainable)
    print(f"[INFO] Fine-tuning activated: {unfrozen} base layers unfrozen at LR={LR_FINE}")


def train_stage(stage_num: int, epochs_head: int, epochs_fine: int, batch_size: int):
    stage_name = f"stage{stage_num}"
    stage_dir  = DATA_DIR / stage_name
    print("\n" + "=" * 65)
    print(f" [TRAINING] Starting {stage_name.upper()} Model Pipeline")
    print(f" Data Directory: {stage_dir}")
    print("=" * 65)

    train_gen, val_gen, test_gen, class_names, class_weights = make_generators(stage_dir, batch_size)

    model, base = build_model(len(class_names))

    # Phase 1: Train classification head
    print(f"\n[PHASE 1] Training classification head for {epochs_head} epoch(s)...")
    t0 = time.time()
    callbacks = [
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True, verbose=1),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7, verbose=1)
    ]
    
    model.fit(
        train_gen,
        epochs=epochs_head,
        validation_data=val_gen,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1
    )
    phase1_dur = (time.time() - t0) / 60
    print(f"[PHASE 1 COMPLETE] Duration: {phase1_dur:.1f} minutes")

    # Phase 2: Fine-tune top layers
    if epochs_fine > 0:
        print(f"\n[PHASE 2] Fine-tuning last {FINE_TUNE_LAYERS} MobileNetV2 layers for {epochs_fine} epoch(s)...")
        enable_fine_tuning(model, base, FINE_TUNE_LAYERS)
        t1 = time.time()
        model.fit(
            train_gen,
            epochs=epochs_fine,
            validation_data=val_gen,
            class_weight=class_weights,
            callbacks=callbacks,
            verbose=1
        )
        phase2_dur = (time.time() - t1) / 60
        print(f"[PHASE 2 COMPLETE] Duration: {phase2_dur:.1f} minutes")

    # Final Validation Evaluation
    val_loss, val_acc = model.evaluate(val_gen, verbose=0)
    print(f"\n[EVALUATION] Final Validation Accuracy: {val_acc * 100:.2f}% | Loss: {val_loss:.4f}")

    # Generate Classification Report
    val_gen.reset()
    preds = model.predict(val_gen, verbose=0)
    y_pred = np.argmax(preds, axis=1)
    print("\n[CLASSIFICATION REPORT - VALIDATION SET]")
    print(classification_report(val_gen.classes, y_pred, target_names=class_names, zero_division=0))

    # Save trained artifacts
    model_save_path = MODELS_DIR / f"{stage_name}_model.keras"
    classes_save_path = MODELS_DIR / f"{stage_name}_classes.json"

    model.save(str(model_save_path))
    with open(classes_save_path, "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)

    print(f"\n[SAVED ARTIFACTS]")
    print(f"  -> Model weights: {model_save_path} ({model_save_path.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"  -> Class labels:  {classes_save_path}")


def main():
    parser = argparse.ArgumentParser(description="ReForm Model Training CLI")
    parser.add_argument("--stage", type=str, default="1", choices=["0", "1", "all"], help="Stage to train: 0 (material), 1 (device/item), or all")
    parser.add_argument("--epochs-head", type=int, default=DEFAULT_HEAD_EP, help=f"Epochs for Phase 1 (default: {DEFAULT_HEAD_EP})")
    parser.add_argument("--epochs-fine", type=int, default=DEFAULT_FINE_EP, help=f"Epochs for Phase 2 (default: {DEFAULT_FINE_EP})")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH, help=f"Batch size (default: {DEFAULT_BATCH})")

    args = parser.parse_args()

    check_gpu()

    if args.stage in ("0", "all"):
        train_stage(0, args.epochs_head, args.epochs_fine, args.batch_size)

    if args.stage in ("1", "all"):
        train_stage(1, args.epochs_head, args.epochs_fine, args.batch_size)

    print("\n" + "=" * 65)
    print(" [DONE] All requested training stages completed successfully!")
    print(" Restart server:app to deploy your newly trained models.")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
