"""
app.py — Root Entry Point for ReForm Streamlit Dashboard
========================================================
Delegates execution to src/app.py.

Run locally:
    streamlit run app.py
"""

import runpy
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

target_script = SRC_DIR / "app.py"
runpy.run_path(str(target_script), run_name="__main__")
