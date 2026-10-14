# 🚀 ReForm — Free Online Deployment Guide (Hugging Face Spaces + Docker)

This guide walks you through deploying ReForm online **100% for free** with **16 GB RAM** and **2 vCPUs** using **FastAPI + Custom Web App + Docker** on Hugging Face Spaces.

---

## 🌟 Why Hugging Face Spaces (Docker)?

| Feature | Hugging Face Spaces (Free) | Other Free Tiers (Render, Koyeb, Fly) |
|---|---|---|
| **Cost** | **$0 / month permanently** | $0 / month (strict limits) |
| **RAM** | **16 GB** (handles TF 2.15 + EasyOCR + PyTorch) | 256 MB – 512 MB (**Crashes with Out Of Memory**) |
| **CPU** | 2 vCPUs | 0.1 – 0.5 shared CPU |
| **Storage** | 50 GB | 1 GB – 3 GB |
| **Custom UI** | Full Vanilla HTML5, CSS3, JavaScript | Varies |
| **Port** | Auto-routes port `7860` | Varies |

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Create a Free Account on Hugging Face
1. Go to [huggingface.co](https://huggingface.co/) and sign up or log in.

---

### Step 2: Create a New Space
1. Click your profile avatar in the top-right corner $\rightarrow$ click **New Space** (or visit [huggingface.co/new-space](https://huggingface.co/new-space)).
2. Fill in the Space settings:
   - **Space name**: `reform-ai` (or any name you choose)
   - **License**: `mit` or `apache-2.0`
   - **Select the Space SDK**: Click **Docker** $\rightarrow$ choose **Blank**
   - **Space Hardware**: Ensure **CPU basic • 2 vCPU • 16GB • Free** is selected
   - **Visibility**: **Public**
3. Click **Create Space**.

---

### Step 3: Push Your Code to the Hugging Face Space

Hugging Face Spaces are Git repositories. You can push your code directly from your computer in 3 commands:

```bash
# 1. Stage the deployment files and models
git add src/ static/ models/ data/knowledge_base.json data/nonplastic_routes.json Dockerfile .dockerignore requirements.txt .gitignore server.py app.py

# 2. Commit the changes
git commit -m "Deploy ReForm full-stack web app with Docker on Hugging Face"

# 3. Add Hugging Face Space as a git remote
# (Replace YOUR_HF_USERNAME with your actual Hugging Face username)
git remote add space https://huggingface.co/spaces/YOUR_HF_USERNAME/reform-ai

# 4. Push to Hugging Face
git push --force space main
```

*(When prompted for credentials, use your Hugging Face username and an [Access Token](https://huggingface.co/settings/tokens) with "Write" permissions).*

---

### Step 4: Watch the Build & Access Your App
1. On your Hugging Face Space page, the status will show **Building**.
2. Hugging Face reads your [Dockerfile](file:///c:/Users/Ruhaan/OneDrive/Desktop/reform/Dockerfile), installs the CPU-optimized dependencies, loads the models, and starts Uvicorn on port `7860`.
3. Within 2–3 minutes, the status will turn **Running** in green!
4. Your application will be live at:
   `https://huggingface.co/spaces/YOUR_HF_USERNAME/reform-ai`

---

## 💻 Running & Testing Locally

You can test the entire full-stack application on your computer anytime:

```bash
# Using your Python virtual environment
.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 7860 --reload
```

Then open [http://127.0.0.1:7860](http://127.0.0.1:7860) in your browser.
