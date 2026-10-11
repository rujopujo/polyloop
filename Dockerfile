# ReForm — Dockerfile for Hugging Face Spaces (Free Tier: 2 vCPU, 16 GB RAM)
FROM python:3.11-slim

# Prevent interactive prompts & buffer stdout
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    TF_ENABLE_ONEDNN_OPTS=0

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set up standard Hugging Face Spaces non-root user (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /home/user/app

# Ensure model cache directories are writable by user 1000
RUN mkdir -p /home/user/.EasyOCR/model && \
    mkdir -p /home/user/.cache

# Copy requirements and install dependencies
COPY --chown=user:user requirements.txt .

# Install PyTorch CPU first (saves ~2GB of CUDA bloat), then other packages
RUN pip install --no-cache-dir --user torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir --user -r requirements.txt

# Copy application files, models, and static assets
COPY --chown=user:user . .

# Expose Hugging Face Spaces default port
EXPOSE 7860

# Start FastAPI application with Uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
