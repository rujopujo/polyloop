import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
APP_DIR = BASE_DIR / "app"
SAMPLES_DIR = BASE_DIR / "samples"
TEST_STAMPS_DIR = SAMPLES_DIR / "test_stamps"
PASSPORTS_DIR = BASE_DIR / "generated_passports"

# Ensure runtime directories exist
TEST_STAMPS_DIR.mkdir(parents=True, exist_ok=True)
PASSPORTS_DIR.mkdir(parents=True, exist_ok=True)

PROJECT_NAME = "PolyLoop"
API_V1_STR = "/api"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'polyloop.db'}")

# YOLO model config
YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
