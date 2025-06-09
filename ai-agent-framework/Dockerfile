# Dockerfile for Pydantic Agent Framework
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN groupadd -r agentuser && useradd -r -g agentuser agentuser
RUN chown -R agentuser:agentuser /app
USER agentuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import asyncio; from pydantic_agent_core import ProductionAgentFramework; print('healthy')" || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "agent_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
