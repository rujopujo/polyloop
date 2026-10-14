@echo off
title ReForm PWA + Cloudflare Tunnel Launcher

echo ====================================================================
echo   ReForm - AI E-Waste Polymer Triage (PWA + Cloudflare Tunnel)
echo ====================================================================
:: Ensure script runs from project root
cd /d "%~dp0.."

if not exist .venv\Scripts\python.exe goto :no_venv

set CF_EXE=cloudflared
where cloudflared >nul 2>nul
if %ERRORLEVEL% equ 0 goto :found_cf

if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    set "CF_EXE=C:\Program Files (x86)\cloudflared\cloudflared.exe"
    goto :found_cf
)

if exist "C:\Program Files\cloudflared\cloudflared.exe" (
    set "CF_EXE=C:\Program Files\cloudflared\cloudflared.exe"
    goto :found_cf
)

echo [ERROR] cloudflared.exe was not found.
echo Please run: winget install --id Cloudflare.cloudflared
pause
exit /b 1

:no_venv
echo [ERROR] Virtual environment .venv was not found!
pause
exit /b 1

:found_cf
echo [1/2] Starting ReForm FastAPI backend on http://127.0.0.1:7860...
start "ReForm Backend Server" cmd /k ".venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 7860"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Cloudflare Tunnel...
echo.
echo ====================================================================
echo  LOOK FOR THE LINK ENDING IN .trycloudflare.com BELOW:
echo ====================================================================
echo.

"%CF_EXE%" tunnel --url http://127.0.0.1:7860
pause
