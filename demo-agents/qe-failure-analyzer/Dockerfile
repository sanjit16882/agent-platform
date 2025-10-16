FROM python:3.11-slim

WORKDIR /app

# Install required packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY src/ ./src/
COPY config/ ./config/

# Set environment variables
ENV PYTHONPATH=/app
ENV AGENT_NAME="QE Failure Analyzer"
ENV AGENT_VERSION="1.0.0"

# Expose port for health checks
EXPOSE 8080

# Run the agent
CMD ["python", "src/main.py"]