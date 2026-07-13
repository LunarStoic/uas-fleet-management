# =============================================================================
# Dockerfile — Dispatch Engine (Python FastAPI + RabbitMQ Consumer)
# =============================================================================
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for OR-Tools and compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Non-root user
RUN useradd -m -u 1001 appuser
USER appuser

EXPOSE 8091

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8091"]
