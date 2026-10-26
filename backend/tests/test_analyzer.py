"""Tests for repository health score calculation and comparison builder."""

from datetime import datetime, timezone

from app.schemas.repository import RepositoryMetadata, RepositoryOwner
from app.services.analyzer import build_comparison, calculate_health_score


def test_calculate_health_score_comprehensive(mock_repo_data):
    """Verify health score is high for well-maintained repo."""
    score, breakdown = calculate_health_score(mock_repo_data)
    assert score >= 80.0
    assert breakdown["description"] == 10
    assert breakdown["license"] == 15
    assert breakdown["issue_tracking"] == 10
    assert breakdown["discussions"] == 10
    assert breakdown["maintained_status"] == 15


def test_calculate_health_score_minimal():
    """Verify health score is minimal for bare-bones repo."""
    minimal_repo = {
        "description": None,
        "license": None,
        "has_issues": False,
        "has_discussions": False,
        "homepage": None,
        "topics": [],
        "archived": True,
        "pushed_at": "2020-01-01T00:00:00Z",
        "stargazers_count": 0,
        "forks_count": 0,
    }
    score, breakdown = calculate_health_score(minimal_repo)
    assert score <= 10.0
    assert breakdown["maintained_status"] == 0


def test_build_comparison(mock_repo_data):
    """Verify side-by-side metric comparison generation."""
    owner = RepositoryOwner(login="fastapi", avatar_url="", html_url="")
    now = datetime.now(timezone.utc)

    repo1 = RepositoryMetadata(
        id=1,
        name="fastapi",
        full_name="tiangolo/fastapi",
        owner=owner,
        html_url="https://github.com/tiangolo/fastapi",
        created_at=now,
        updated_at=now,
        pushed_at=now,
        stargazers_count=75000,
        forks_count=6000,
        health_score=95.0,
    )

    repo2 = RepositoryMetadata(
        id=2,
        name="flask",
        full_name="pallets/flask",
        owner=owner,
        html_url="https://github.com/pallets/flask",
        created_at=now,
        updated_at=now,
        pushed_at=now,
        stargazers_count=68000,
        forks_count=16000,
        health_score=90.0,
    )

    comparison = build_comparison([repo1, repo2])
    assert len(comparison.repositories) == 2
    assert len(comparison.metrics) > 0

    stars_metric = next(m for m in comparison.metrics if m.key == "stargazers_count")
    assert stars_metric.values["tiangolo/fastapi"] == 75000
    assert stars_metric.values["pallets/flask"] == 68000
    assert stars_metric.best_repo == "tiangolo/fastapi"

    forks_metric = next(m for m in comparison.metrics if m.key == "forks_count")
    assert forks_metric.best_repo == "pallets/flask"

    assert comparison.summary["most_starred"] == "tiangolo/fastapi"
    assert comparison.summary["most_forked"] == "pallets/flask"
