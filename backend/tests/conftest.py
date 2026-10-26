"""Pytest test configuration and mock fixtures."""

from typing import Any, AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.cache import cache


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear in-memory cache before every test run."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def mock_repo_data() -> dict[str, Any]:
    """Sample raw GitHub repository API response."""
    return {
        "id": 12345678,
        "name": "fastapi",
        "full_name": "fastapi/fastapi",
        "owner": {
            "login": "fastapi",
            "avatar_url": "https://avatars.githubusercontent.com/u/12345?v=4",
            "html_url": "https://github.com/fastapi",
            "type": "Organization",
        },
        "html_url": "https://github.com/fastapi/fastapi",
        "description": "FastAPI framework, high performance, easy to learn, fast to code, ready for production",
        "fork": False,
        "created_at": "2018-12-08T08:21:47Z",
        "updated_at": "2026-10-26T12:00:00Z",
        "pushed_at": "2026-10-26T10:00:00Z",
        "homepage": "https://fastapi.tiangolo.com/",
        "size": 15000,
        "stargazers_count": 78000,
        "watchers_count": 78000,
        "language": "Python",
        "forks_count": 6200,
        "open_issues_count": 120,
        "license": {
            "key": "mit",
            "name": "MIT License",
            "spdx_id": "MIT",
            "url": "https://api.github.com/licenses/mit",
        },
        "topics": ["fastapi", "python", "pydantic", "starlette", "api"],
        "default_branch": "master",
        "has_issues": True,
        "has_projects": True,
        "has_wiki": False,
        "has_pages": False,
        "has_discussions": True,
        "archived": False,
        "disabled": False,
        "visibility": "public",
    }


@pytest.fixture
def mock_languages_data() -> dict[str, int]:
    """Sample language byte breakdown."""
    return {
        "Python": 2500000,
        "HTML": 45000,
        "JavaScript": 12000,
    }


@pytest.fixture
def mock_commits_data() -> list[dict[str, Any]]:
    """Sample commits response."""
    return [
        {
            "sha": "abcdef1234567890abcdef1234567890abcdef12",
            "commit": {
                "message": "docs: update tutorial and advanced examples\n\nDetailed notes here.",
                "author": {
                    "name": "Sebastián Ramírez",
                    "date": "2026-10-26T09:30:00Z",
                },
            },
            "committer": {
                "avatar_url": "https://avatars.githubusercontent.com/u/tiangolo?v=4",
            },
            "html_url": "https://github.com/fastapi/fastapi/commit/abcdef1",
        }
    ]


@pytest.fixture
def mock_releases_data() -> list[dict[str, Any]]:
    """Sample releases response."""
    return [
        {
            "id": 998877,
            "tag_name": "0.115.0",
            "name": "FastAPI 0.115.0 Release",
            "published_at": "2026-09-15T14:20:00Z",
            "html_url": "https://github.com/fastapi/fastapi/releases/tag/0.115.0",
            "prerelease": False,
            "draft": False,
            "body": "### Features\n- Modern Pydantic v2 performance updates",
        }
    ]


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Async test client bound to FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
