# ReForm - AI E-Waste Polymer Triage Launcher
# Launches FastAPI backend + Cloudflare Tunnel for PWA access

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  ReForm - AI E-Waste Polymer Triage (PWA + Cloudflare Tunnel)       " -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify venv
$pythonPath = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonPath)) {
    Write-Host "[ERROR] Virtual environment not found at $pythonPath" -ForegroundColor Red
    exit 1
}

# 2. Locate cloudflared executable
$cfExe = $null
if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
    $cfExe = "cloudflared"
} else {
    $candidates = @(
        "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe",
        "$env:ProgramFiles\cloudflared\cloudflared.exe"
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path $c)) {
            $cfExe = $c
            break
        }
    }
}

if (-not $cfExe) {
    Write-Host "[INFO] cloudflared not found. Installing via winget..." -ForegroundColor Yellow
    winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
    if (Test-Path "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe") {
        $cfExe = "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe"
    } elseif (Test-Path "$env:ProgramFiles\cloudflared\cloudflared.exe") {
        $cfExe = "$env:ProgramFiles\cloudflared\cloudflared.exe"
    }
}

if (-not $cfExe) {
    Write-Host "[ERROR] cloudflared is still not available. Please restart your terminal." -ForegroundColor Red
    exit 1
}

Write-Host "[1/2] Starting ReForm FastAPI backend on http://127.0.0.1:7860..." -ForegroundColor Green
$serverProcess = Start-Process -FilePath $pythonPath -ArgumentList "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "7860" -PassThru

Start-Sleep -Seconds 3

Write-Host "[2/2] Launching Cloudflare Tunnel for secure HTTPS PWA access..." -ForegroundColor Cyan
Write-Host "Look for the public https://*.trycloudflare.com link below!" -ForegroundColor Yellow
Write-Host ""

try {
    & $cfExe tunnel --url http://127.0.0.1:7860
} finally {
    Write-Host "Stopping backend server..." -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}
