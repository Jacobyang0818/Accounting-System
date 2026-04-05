FROM python:3.13-slim

WORKDIR /app

# Install uv for fast dependency resolution
RUN pip install uv

# Copy project definition files
COPY pyproject.toml .

# Install dependencies
RUN uv pip compile pyproject.toml -o requirements.txt && \
    uv pip install --system -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose backend port
EXPOSE 8000

CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
