"""Pydantic schemas for GitHub repository intelligence data."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class RepositoryOwner(BaseModel):
    """Repository owner information."""

    login: str
    avatar_url: str
    html_url: str
    type: str = "User"


class LicenseInfo(BaseModel):
    """Repository license information."""

    key: str | None = None
    name: str | None = None
    spdx_id: str | None = None
    url: str | None = None


class RepositoryMetadata(BaseModel):
    """Complete metadata for a public repository."""

    id: int
    name: str
    full_name: str
    owner: RepositoryOwner
    html_url: str
    description: str | None = None
    fork: bool = False
    created_at: datetime
    updated_at: datetime
    pushed_at: datetime | None = None
    homepage: str | None = None
    size_kb: int = 0
    stargazers_count: int = 0
    watchers_count: int = 0
    language: str | None = None
    forks_count: int = 0
    open_issues_count: int = 0
    license: LicenseInfo | None = None
    topics: list[str] = Field(default_factory=list)
    default_branch: str = "main"
    has_issues: bool = True
    has_projects: bool = True
    has_wiki: bool = False
    has_pages: bool = False
    has_discussions: bool = False
    archived: bool = False
    disabled: bool = False
    visibility: str = "public"

    # Enriched intelligence metrics
    languages: dict[str, int] = Field(default_factory=dict)
    health_score: float = Field(default=0.0, ge=0.0, le=100.0)
    health_breakdown: dict[str, int] = Field(default_factory=dict)


class CommitAuthor(BaseModel):
    """Author details for a commit."""

    name: str | None = None
    date: datetime | None = None


class CommitActivity(BaseModel):
    """Simplified commit activity item."""

    sha: str
    message: str
    author_name: str | None = None
    author_avatar: str | None = None
    date: datetime | None = None
    html_url: str


class ReleaseInfo(BaseModel):
    """Release metadata."""

    id: int
    tag_name: str
    name: str | None = None
    published_at: datetime | None = None
    html_url: str
    prerelease: bool = False
    draft: bool = False
    body: str | None = None


class RepositoryActivity(BaseModel):
    """Recent activity stream and releases for a repository."""

    full_name: str
    recent_commits: list[CommitActivity] = Field(default_factory=list)
    recent_releases: list[ReleaseInfo] = Field(default_factory=list)
    total_releases: int = 0
    has_recent_commits: bool = False


class CompareRequest(BaseModel):
    """Request payload for comparing repositories."""

    repositories: list[str] = Field(
        ...,
        min_length=1,
        max_length=3,
        description="List of owner/repo identifiers (maximum 3)",
    )


class ComparisonMetric(BaseModel):
    """Comparative metric row across repositories."""

    key: str
    label: str
    values: dict[str, Any]
    best_repo: str | None = None
    format: str = "number"  # 'number', 'string', 'date', 'bytes', 'percent'


class RepositoryComparison(BaseModel):
    """Comprehensive comparison between up to 3 repositories."""

    repositories: list[RepositoryMetadata]
    metrics: list[ComparisonMetric]
    summary: dict[str, str | None]


class SearchItem(BaseModel):
    """Compact repository preview in search results."""

    id: int
    full_name: str
    name: str
    owner_login: str
    owner_avatar: str
    description: str | None = None
    stargazers_count: int = 0
    forks_count: int = 0
    open_issues_count: int = 0
    language: str | None = None
    updated_at: datetime


class SearchResult(BaseModel):
    """Paginated search response."""

    total_count: int
    query: str
    items: list[SearchItem]


class RateLimitInfo(BaseModel):
    """Current GitHub API rate limit state."""

    limit: int
    remaining: int
    reset_timestamp: int
    reset_datetime: datetime | None = None
    used: int
    authenticated: bool
