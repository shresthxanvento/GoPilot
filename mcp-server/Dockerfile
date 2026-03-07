FROM python:3.11-slim
WORKDIR /GoPilot/mcp-server

# Install sqlite3 and uv (since agent.py uses 'uv run')
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir uv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

CMD ["python", "agent.py"]