# Dockerfile for Railway deployment
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory
COPY backend/ .

# Railway automatically provides PORT env var
# Don't hardcode EXPOSE - Railway will detect the port from the CMD

# Start the application (Railway provides PORT env var)
# Use exec form to ensure proper signal handling
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

