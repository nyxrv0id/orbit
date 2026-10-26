"""Tests for health and rate limit endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(async_client: AsyncClient):
    """Verify /api/health returns 200 and operational details."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Orbit OSINT API"
    assert "version" in data
    assert "cache_entries" in data


@pytest.mark.asyncio
async def test_rate_limit_endpoint(async_client: AsyncClient):
    """Verify /api/rate-limit returns valid structure."""
    response = await async_client.get("/api/rate-limit")
    assert response.status_code == 200
    data = response.json()
    assert "limit" in data
    assert "remaining" in data
    assert "used" in data
    assert isinstance(data["authenticated"], bool)
