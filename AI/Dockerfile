FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Spacy model
RUN python -m spacy download en_core_web_sm

# Copy the rest of the code
COPY . .

# Expose the port (Railway provides PORT env var)
EXPOSE 8000

# Start command
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
