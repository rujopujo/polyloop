"""
server.py — Root Entry Point for ReForm FastAPI Application
===========================================================
Delegates execution to src.server:app.

Run locally:
    python -m uvicorn server:app --host 127.0.0.1 --port 7860 --reload
Or directly:
    python server.py
"""

import sys
from pathlib import Path

# Add project root and src/ directory to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from src.server import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.server:app", host="127.0.0.1", port=7860, reload=True)
