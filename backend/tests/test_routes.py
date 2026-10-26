"""Integration tests for Orbit API routes with mocked GitHub upstream responses."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_repo_details_success(
    async_client: AsyncClient,
    mock_repo_data,
    mock_languages_data,
):
    """Test fetching repository details returns enriched metadata."""
    with (
        patch("app.services.github.github_service.get_repository", new_callable=AsyncMock) as mock_get_repo,
        patch("app.services.github.github_service.get_languages", new_callable=AsyncMock) as mock_get_lang,
    ):
        mock_get_repo.return_value = mock_repo_data
        mock_get_lang.return_value = mock_languages_data

        response = await async_client.get("/api/repo/fastapi/fastapi")
        assert response.status_code == 200
        data = response.json()

        assert data["full_name"] == "fastapi/fastapi"
        assert data["stargazers_count"] == 78000
        assert data["language"] == "Python"
        assert "languages" in data
        assert data["languages"]["Python"] == 2500000
        assert data["health_score"] > 80.0
        assert "health_breakdown" in data


@pytest.mark.asyncio
async def test_get_repo_details_invalid_name(async_client: AsyncClient):
    """Test that invalid repository names are rejected with 400."""
    response = await async_client.get("/api/repo/invalid%20name/repo;bad")
    assert response.status_code == 400
    assert "Invalid repository" in response.json()["message"]


@pytest.mark.asyncio
async def test_get_repo_details_not_found(async_client: AsyncClient):
    """Test 404 response for nonexistent repositories."""
    from fastapi import HTTPException

    with patch(
        "app.services.github.github_service.get_repository",
        side_effect=HTTPException(status_code=404, detail="Resource not found on GitHub."),
    ):
        response = await async_client.get("/api/repo/nonexistent/project")
        assert response.status_code == 404
        assert "not found" in response.json()["message"].lower()


@pytest.mark.asyncio
async def test_get_repo_activity(
    async_client: AsyncClient,
    mock_commits_data,
    mock_releases_data,
):
    """Test fetching activity stream."""
    with (
        patch("app.services.github.github_service.get_commits", new_callable=AsyncMock) as mock_commits,
        patch("app.services.github.github_service.get_releases", new_callable=AsyncMock) as mock_releases,
    ):
        mock_commits.return_value = mock_commits_data
        mock_releases.return_value = mock_releases_data

        response = await async_client.get("/api/repo/fastapi/fastapi/activity")
        assert response.status_code == 200
        data = response.json()

        assert data["full_name"] == "fastapi/fastapi"
        assert len(data["recent_commits"]) == 1
        assert data["recent_commits"][0]["sha"] == "abcdef1"
        assert len(data["recent_releases"]) == 1
        assert data["recent_releases"][0]["tag_name"] == "0.115.0"


@pytest.mark.asyncio
async def test_compare_repositories(
    async_client: AsyncClient,
    mock_repo_data,
    mock_languages_data,
):
    """Test comparing repositories side-by-side."""
    with (
        patch("app.services.github.github_service.get_repository", new_callable=AsyncMock) as mock_get_repo,
        patch("app.services.github.github_service.get_languages", new_callable=AsyncMock) as mock_get_lang,
    ):
        repo1_data = {**mock_repo_data, "full_name": "tiangolo/fastapi", "name": "fastapi", "stargazers_count": 80000}
        repo2_data = {**mock_repo_data, "full_name": "pallets/flask", "name": "flask", "stargazers_count": 65000}

        def mock_repo_router(owner, repo):
            if repo == "fastapi":
                return repo1_data
            return repo2_data

        mock_get_repo.side_effect = mock_repo_router
        mock_get_lang.return_value = mock_languages_data

        response = await async_client.post(
            "/api/compare",
            json={"repositories": ["tiangolo/fastapi", "pallets/flask"]},
        )
        assert response.status_code == 200
        data = response.json()

        assert len(data["repositories"]) == 2
        assert len(data["metrics"]) > 0
        assert data["summary"]["most_starred"] == "tiangolo/fastapi"


@pytest.mark.asyncio
async def test_compare_repositories_validation_errors(async_client: AsyncClient):
    """Test comparison input validation for too many or invalid formats."""
    # Exceeding 3 repositories
    res_too_many = await async_client.post(
        "/api/compare",
        json={"repositories": ["a/1", "b/2", "c/3", "d/4"]},
    )
    assert res_too_many.status_code == 422 or res_too_many.status_code == 400

    # Malformed identifier
    res_malformed = await async_client.post(
        "/api/compare",
        json={"repositories": ["invalid_format_without_slash"]},
    )
    assert res_malformed.status_code == 400


@pytest.mark.asyncio
async def test_compare_repositories_get(
    async_client: AsyncClient,
    mock_repo_data,
    mock_languages_data,
):
    """Test comparing repositories via GET query parameters."""
    with (
        patch("app.services.github.github_service.get_repository", new_callable=AsyncMock) as mock_get_repo,
        patch("app.services.github.github_service.get_languages", new_callable=AsyncMock) as mock_get_lang,
    ):
        mock_get_repo.return_value = mock_repo_data
        mock_get_lang.return_value = mock_languages_data

        response = await async_client.get("/api/compare?repos=tiangolo/fastapi&repos=pallets/flask")
        assert response.status_code == 200
        data = response.json()
        assert len(data["repositories"]) == 2
        assert len(data["metrics"]) > 0


@pytest.mark.asyncio
async def test_search_repositories(async_client: AsyncClient):
    """Test searching public repositories."""
    search_mock = {
        "total_count": 1,
        "items": [
            {
                "id": 999,
                "name": "fastapi",
                "full_name": "tiangolo/fastapi",
                "owner": {"login": "tiangolo", "avatar_url": "https://avatars.github.com/u/1"},
                "description": "FastAPI framework",
                "stargazers_count": 80000,
                "forks_count": 6000,
                "open_issues_count": 100,
                "language": "Python",
                "updated_at": "2026-10-26T12:00:00Z",
            }
        ],
    }

    with patch("app.services.github.github_service.search_repositories", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = search_mock

        response = await async_client.get("/api/search?q=fastapi")
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 1
        assert data["items"][0]["full_name"] == "tiangolo/fastapi"
