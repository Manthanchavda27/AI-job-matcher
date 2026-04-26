FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage Docker cache
COPY requirements.txt .

# 1. Install CPU-only version of PyTorch (This shrinks the image from 6GB to <1GB)
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 2. Install the rest of the requirements
RUN pip install --no-cache-dir -r requirements.txt

# 3. Download Spacy model
RUN python -m spacy download en_core_web_sm

# Copy the rest of the code
COPY . .

# Start command
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
