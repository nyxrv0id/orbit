"""GitHub REST API Service with bounded caching and robust error handling."""

import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.services.cache import cache

logger = logging.getLogger("orbit.github")

GITHUB_API_BASE = "https://api.github.com"


class GitHubClient:
    """Asynchronous client for querying GitHub public intelligence endpoints."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: httpx.AsyncClient | None = None

    async def get_client(self) -> httpx.AsyncClient:
        """Get or initialize the shared async HTTP client."""
        if self._client is None or self._client.is_closed:
            headers = {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Orbit-OSINT-Dashboard/0.1.0",
            }
            if self.settings.github_token:
                headers["Authorization"] = f"Bearer {self.settings.github_token}"

            self._client = httpx.AsyncClient(
                base_url=GITHUB_API_BASE,
                headers=headers,
                timeout=httpx.Timeout(self.settings.http_timeout_seconds),
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def _request(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        """Execute a GET request with error mapping and caching."""
        # Check cache
        cache_key = f"github:{endpoint}:{str(params or {})}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result

        client = await self.get_client()
        try:
            response = await client.get(endpoint, params=params)
        except httpx.TimeoutException as exc:
            logger.warning(f"Timeout while requesting {endpoint}")
            raise HTTPException(
                status_code=504,
                detail=f"GitHub API request timed out after {self.settings.http_timeout_seconds}s.",
            ) from exc
        except httpx.RequestError as exc:
            logger.error(f"Network error querying GitHub API: {exc}")
            raise HTTPException(
                status_code=502,
                detail="Unable to reach GitHub API. Check network connectivity.",
            ) from exc

        # Handle rate limiting
        if response.status_code in (403, 429):
            remaining = response.headers.get("x-ratelimit-remaining", "0")
            reset_ts = response.headers.get("x-ratelimit-reset")
            reset_msg = ""
            if reset_ts:
                try:
                    reset_time = datetime.fromtimestamp(int(reset_ts), tz=timezone.utc).strftime(
                        "%Y-%m-%d %H:%M:%S UTC"
                    )
                    reset_msg = f" Rate limit resets at {reset_time}."
                except Exception:
                    pass

            if remaining == "0" or "rate limit" in response.text.lower():
                raise HTTPException(
                    status_code=429,
                    detail=(
                        f"GitHub API rate limit exceeded.{reset_msg} "
                        "Provide a GITHUB_TOKEN in .env to increase capacity."
                    ),
                )

        # Handle not found
        if response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Resource not found on GitHub at '{endpoint}'.",
            )

        # Other non-200 responses
        if response.status_code >= 400:
            error_data = response.json() if "application/json" in response.headers.get("content-type", "") else {}
            msg = error_data.get("message", f"Upstream GitHub returned status {response.status_code}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"GitHub error: {msg}",
            )

        data = response.json()
        cache.set(cache_key, data, ttl_seconds=self.settings.cache_ttl_seconds)
        return data

    async def get_repository(self, owner: str, repo: str) -> dict[str, Any]:
        """Fetch primary repository metadata."""
        return await self._request(f"/repos/{owner}/{repo}")

    async def get_languages(self, owner: str, repo: str) -> dict[str, int]:
        """Fetch language byte breakdown."""
        try:
            return await self._request(f"/repos/{owner}/{repo}/languages")
        except HTTPException as exc:
            # If languages 404, return empty dictionary without failing the main request
            if exc.status_code == 404:
                return {}
            raise

    async def get_commits(self, owner: str, repo: str, per_page: int = 10) -> list[dict[str, Any]]:
        """Fetch recent commit log."""
        try:
            res = await self._request(f"/repos/{owner}/{repo}/commits", params={"per_page": per_page})
            return res if isinstance(res, list) else []
        except HTTPException as exc:
            if exc.status_code in (404, 409):  # 409 = Git Repository is empty
                return []
            raise

    async def get_releases(self, owner: str, repo: str, per_page: int = 5) -> list[dict[str, Any]]:
        """Fetch recent releases."""
        try:
            res = await self._request(f"/repos/{owner}/{repo}/releases", params={"per_page": per_page})
            return res if isinstance(res, list) else []
        except HTTPException as exc:
            if exc.status_code == 404:
                return []
            raise

    async def search_repositories(self, query: str, per_page: int = 10) -> dict[str, Any]:
        """Search public repositories by keyword."""
        return await self._request("/search/repositories", params={"q": query, "per_page": per_page})

    async def get_rate_limit(self) -> dict[str, Any]:
        """Fetch current rate limit status."""
        client = await self.get_client()
        try:
            res = await client.get("/rate_limit")
            if res.status_code == 200:
                return res.json()
        except Exception:
            pass

        # Return fallback if call fails
        return {
            "resources": {
                "core": {
                    "limit": 5000 if self.settings.github_token else 60,
                    "remaining": 60,
                    "reset": int(datetime.now(timezone.utc).timestamp()) + 3600,
                    "used": 0,
                }
            }
        }


# Singleton client instance
github_service = GitHubClient()
