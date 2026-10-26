"""FastAPI API route definitions for Orbit."""

import asyncio
import re
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query

from app.schemas.repository import (
    CommitActivity,
    CompareRequest,
    LicenseInfo,
    RateLimitInfo,
    ReleaseInfo,
    RepositoryActivity,
    RepositoryComparison,
    RepositoryMetadata,
    RepositoryOwner,
    SearchItem,
    SearchResult,
)
from app.services.analyzer import build_comparison, calculate_health_score
from app.services.cache import cache
from app.services.github import github_service

router = APIRouter(prefix="/api")

REPO_NAME_REGEX = re.compile(r"^[A-Za-z0-9_.-]+$")


def validate_repo_identifier(owner: str, repo: str) -> None:
    """Validate owner and repo naming constraints."""
    if not owner or not REPO_NAME_REGEX.match(owner):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid repository owner '{owner}'. Must contain only alphanumeric, dashes, dots, or underscores.",
        )
    if not repo or not REPO_NAME_REGEX.match(repo):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid repository name '{repo}'. Must contain only alphanumeric, dashes, dots, or underscores.",
        )


@router.get("/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint providing system status and cache diagnostics."""
    return {
        "status": "ok",
        "service": "Orbit OSINT API",
        "version": "0.1.0",
        "cache_entries": cache.size(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/rate-limit", response_model=RateLimitInfo)
async def get_rate_limit() -> RateLimitInfo:
    """Check current GitHub API rate limit status."""
    rate_data = await github_service.get_rate_limit()
    core = rate_data.get("resources", {}).get("core", {})
    reset_ts = core.get("reset", 0)
    reset_dt = datetime.fromtimestamp(reset_ts, tz=timezone.utc) if reset_ts else None

    return RateLimitInfo(
        limit=core.get("limit", 60),
        remaining=core.get("remaining", 60),
        reset_timestamp=reset_ts,
        reset_datetime=reset_dt,
        used=core.get("used", 0),
        authenticated=bool(github_service.settings.github_token),
    )


@router.get("/search", response_model=SearchResult)
async def search_repositories(
    q: str = Query(..., min_length=1, max_length=100, description="Search keyword or owner/repo"),
    per_page: int = Query(10, ge=1, le=25, description="Number of results"),
) -> SearchResult:
    """Search public GitHub repositories."""
    raw = await github_service.search_repositories(query=q, per_page=per_page)
    items: list[SearchItem] = []

    for item in raw.get("items", []):
        owner_obj = item.get("owner", {})
        items.append(
            SearchItem(
                id=item["id"],
                full_name=item["full_name"],
                name=item["name"],
                owner_login=owner_obj.get("login", ""),
                owner_avatar=owner_obj.get("avatar_url", ""),
                description=item.get("description"),
                stargazers_count=item.get("stargazers_count", 0),
                forks_count=item.get("forks_count", 0),
                open_issues_count=item.get("open_issues_count", 0),
                language=item.get("language"),
                updated_at=item["updated_at"],
            )
        )

    return SearchResult(
        total_count=raw.get("total_count", len(items)),
        query=q,
        items=items,
    )


@router.get("/repo/{owner}/{repo}", response_model=RepositoryMetadata)
async def get_repository_details(owner: str, repo: str) -> RepositoryMetadata:
    """Get rich metadata, health score, and language distribution for a repository."""
    validate_repo_identifier(owner, repo)

    # Fetch main repo metadata and language distribution concurrently
    raw_repo, languages = await asyncio.gather(
        github_service.get_repository(owner, repo),
        github_service.get_languages(owner, repo),
    )

    owner_data = raw_repo.get("owner", {})
    owner_model = RepositoryOwner(
        login=owner_data.get("login", owner),
        avatar_url=owner_data.get("avatar_url", ""),
        html_url=owner_data.get("html_url", f"https://github.com/{owner}"),
        type=owner_data.get("type", "User"),
    )

    license_data = raw_repo.get("license")
    license_model = (
        LicenseInfo(
            key=license_data.get("key"),
            name=license_data.get("name"),
            spdx_id=license_data.get("spdx_id"),
            url=license_data.get("url"),
        )
        if license_data
        else None
    )

    health_score, health_breakdown = calculate_health_score(raw_repo)

    return RepositoryMetadata(
        id=raw_repo["id"],
        name=raw_repo["name"],
        full_name=raw_repo["full_name"],
        owner=owner_model,
        html_url=raw_repo["html_url"],
        description=raw_repo.get("description"),
        fork=raw_repo.get("fork", False),
        created_at=raw_repo["created_at"],
        updated_at=raw_repo["updated_at"],
        pushed_at=raw_repo.get("pushed_at"),
        homepage=raw_repo.get("homepage"),
        size_kb=raw_repo.get("size", 0),
        stargazers_count=raw_repo.get("stargazers_count", 0),
        watchers_count=raw_repo.get("watchers_count", 0),
        language=raw_repo.get("language"),
        forks_count=raw_repo.get("forks_count", 0),
        open_issues_count=raw_repo.get("open_issues_count", 0),
        license=license_model,
        topics=raw_repo.get("topics", []),
        default_branch=raw_repo.get("default_branch", "main"),
        has_issues=raw_repo.get("has_issues", True),
        has_projects=raw_repo.get("has_projects", True),
        has_wiki=raw_repo.get("has_wiki", False),
        has_pages=raw_repo.get("has_pages", False),
        has_discussions=raw_repo.get("has_discussions", False),
        archived=raw_repo.get("archived", False),
        disabled=raw_repo.get("disabled", False),
        visibility=raw_repo.get("visibility", "public"),
        languages=languages,
        health_score=health_score,
        health_breakdown=health_breakdown,
    )


@router.get("/repo/{owner}/{repo}/activity", response_model=RepositoryActivity)
async def get_repository_activity(owner: str, repo: str) -> RepositoryActivity:
    """Fetch recent commits and release log for a repository."""
    validate_repo_identifier(owner, repo)

    raw_commits, raw_releases = await asyncio.gather(
        github_service.get_commits(owner, repo, per_page=10),
        github_service.get_releases(owner, repo, per_page=5),
    )

    commits: list[CommitActivity] = []
    for c in raw_commits:
        commit_obj = c.get("commit", {})
        committer = c.get("committer") or {}
        author_info = commit_obj.get("author") or {}
        message = commit_obj.get("message", "").split("\n")[0]  # First line of commit message

        commits.append(
            CommitActivity(
                sha=c.get("sha", "")[:7],
                message=message or "Commit",
                author_name=author_info.get("name"),
                author_avatar=committer.get("avatar_url"),
                date=author_info.get("date"),
                html_url=c.get("html_url", ""),
            )
        )

    releases: list[ReleaseInfo] = []
    for r in raw_releases:
        releases.append(
            ReleaseInfo(
                id=r["id"],
                tag_name=r.get("tag_name", ""),
                name=r.get("name") or r.get("tag_name", "Release"),
                published_at=r.get("published_at"),
                html_url=r.get("html_url", ""),
                prerelease=r.get("prerelease", False),
                draft=r.get("draft", False),
                body=r.get("body"),
            )
        )

    return RepositoryActivity(
        full_name=f"{owner}/{repo}",
        recent_commits=commits,
        recent_releases=releases,
        total_releases=len(releases),
        has_recent_commits=len(commits) > 0,
    )


async def _execute_comparison(repo_identifiers: list[str]) -> RepositoryComparison:
    """Internal helper to benchmark 1 to 3 repositories side-by-side."""
    cleaned_identifiers = []
    for r in repo_identifiers:
        # Handle comma-separated query parameters e.g. repos=a/b,c/d
        for sub in r.split(","):
            trimmed = sub.strip()
            if trimmed:
                cleaned_identifiers.append(trimmed)

    # Validate repo list
    if len(cleaned_identifiers) < 1:
        raise HTTPException(status_code=400, detail="At least 1 repository must be specified.")
    if len(cleaned_identifiers) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 repositories can be compared at once.")

    tasks = []
    for identifier in cleaned_identifiers:
        parts = identifier.split("/")
        if len(parts) != 2:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid repository identifier '{identifier}'. Format must be 'owner/repo'.",
            )
        owner, repo = parts[0].strip(), parts[1].strip()
        validate_repo_identifier(owner, repo)
        tasks.append(get_repository_details(owner, repo))

    # Fetch all repository metadata in parallel
    try:
        repos = await asyncio.gather(*tasks)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to gather comparison data: {str(exc)}",
        ) from exc

    return build_comparison(list(repos))


@router.get("/compare", response_model=RepositoryComparison)
async def compare_repositories_get(
    repos: Annotated[list[str], Query(description="Repository owner/repo identifiers to compare")],
) -> RepositoryComparison:
    """Compare 1 to 3 repositories side-by-side using query parameters."""
    return await _execute_comparison(repos)


@router.post("/compare", response_model=RepositoryComparison)
async def compare_repositories(request: CompareRequest) -> RepositoryComparison:
    """Compare 1 to 3 repositories side-by-side using JSON body."""
    return await _execute_comparison(request.repositories)
