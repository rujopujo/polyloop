# 📱 ReForm — PWA & Cloudflare Tunnel User Guide

This guide explains how to run **ReForm** as an installable **Progressive Web App (PWA)** on any mobile device, tablet, or desktop using a secure, free **Cloudflare Tunnel (`cloudflared`)**.

---

## ⚡ 1-Click Launch (Easiest)

We've provided automatic launcher scripts in the repository root:

### On Windows Command Prompt / File Explorer:
Double-click `start_tunnel.bat` (or run in cmd):
```bat
start_tunnel.bat
```

### On PowerShell:
```powershell
.\start_tunnel.ps1
```

### What the script does automatically:
1. Verifies your Python virtual environment (`.venv`).
2. Checks if `cloudflared` is installed (and offers to install it via `winget` if missing).
3. Starts the FastAPI + TensorFlow backend on `http://127.0.0.1:7860`.
4. Opens a Cloudflare Quick Tunnel to expose the server over a public HTTPS URL:
   ```text
   +--------------------------------------------------------------------------------------------+
   | Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):    |
   | https://<random-id>.trycloudflare.com                                                      |
   +--------------------------------------------------------------------------------------------+
   ```

---

## 📲 How to Install the PWA on Your Devices

Because Cloudflare provides a valid universal SSL certificate (`https://`), modern browsers treat ReForm as a trusted secure app, unlocking the native camera hardware and PWA installation:

### On Android (Chrome / Edge / Brave):
1. Open the Cloudflare URL (`https://*.trycloudflare.com`) on your mobile browser.
2. You will see an **"Install App"** glowing button in the header bar.
3. Tap **Install App** (or tap the 3-dots menu $\rightarrow$ **Install app** / **Add to Home screen**).
4. ReForm now appears on your app launcher/home screen like a native mobile app!
5. Tap the app icon $\rightarrow$ grant camera access $\rightarrow$ scan e-waste items and resin codes in the field.

### On iOS / iPhone (Safari):
1. Open the Cloudflare URL in **Safari**.
2. Tap the **Share** button (box with an upward arrow at the bottom).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. ReForm launches in fullscreen standalone mode without browser URL bars.

### On Windows / Mac (Chrome / Edge):
1. Open the Cloudflare URL in Chrome or Edge.
2. Click the **Install App** button in the header (or the install icon in the browser address bar).
3. ReForm runs as an independent desktop application window.

---

## 🔒 Permanent Custom Domain Setup (Optional)

If you own a domain connected to Cloudflare (e.g., `yourdomain.com`) and want a permanent URL like `reform.yourdomain.com`:

1. **Log in to Cloudflare**:
   ```powershell
   cloudflared tunnel login
   ```
2. **Create a named tunnel**:
   ```powershell
   cloudflared tunnel create reform-app
   ```
3. **Route your subdomain in DNS**:
   ```powershell
   cloudflared tunnel route dns reform-app reform.yourdomain.com
   ```
4. **Run the tunnel**:
   ```powershell
   cloudflared tunnel run --url http://127.0.0.1:7860 reform-app
   ```
5. *(Optional)* Install as a persistent Windows Service:
   ```powershell
   cloudflared service install
   Start-Service cloudflared
   ```

---

## 🛠️ Offline & Field Operation Notes
- **UI Shell Caching**: The HTML, CSS, JavaScript, and fonts are cached locally by `sw.js`. Even in recycling yards with zero reception, the application shell opens instantly.
- **AI Inference**: Model inference (`/api/step1-classify`, `/api/step2-ocr`) requires connectivity to your host computer. If connection drops, the status pill updates to **"Offline Mode"** and alerts the user to reconnect.
