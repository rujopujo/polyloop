@echo off
title PolyLoop Local Web Application
echo ========================================================
echo  POLYLOOP: ZERO-COST E-WASTE RESIN REUSE SUITE
echo  Starting Local Web App on http://localhost:8000 ...
echo ========================================================
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
