# Orbit Backend Service

High-performance FastAPI service providing repository analysis, metrics aggregation, activity streaming, and comparison capabilities for GitHub repositories.

## Features

- **Repository Metadata Aggregation**: Queries GitHub REST v3 API with error resilience and timeouts.
- **Repository Health Algorithm**: Calculates an algorithmic 0–100 health score broken down into Maintenance, Community, Governance, and Stability.
- **Comparison Engine**: Benchmarks up to 3 repositories side-by-side with leader detection.
- **In-Memory TTL Caching**: Bounded, thread-safe cache reducing redundant GitHub API calls.
- **Rate-Limit Resilience**: Gracefully differentiates unauthenticated (60 req/hr) from authenticated (5,000 req/hr) limits with reset timestamps.

## Local Development

```bash
# Set up virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies in editable mode
pip install -e ".[dev]"

# Run tests
pytest -v

# Run lint & formatting checks
ruff check .
ruff format --check .

# Start development server
uvicorn app.main:app --reload --port 8000
```
