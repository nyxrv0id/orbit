"""Intelligence and analytics helpers for repository metrics and comparisons."""

from datetime import datetime, timezone
from typing import Any

from app.schemas.repository import (
    ComparisonMetric,
    RepositoryComparison,
    RepositoryMetadata,
)


def calculate_health_score(raw_repo: dict[str, Any]) -> tuple[float, dict[str, int]]:
    """
    Calculate an open-source health score from 0 to 100 based on standard OSS hygiene indicators.

    Factors:
    - Has description: +10
    - Has license: +15
    - Has open issues enabled: +10
    - Has discussions enabled: +10
    - Has custom homepage / doc link: +5
    - Has topic tags: +10
    - Not archived or disabled: +15
    - Activity recency (pushed within 30 days: +15, 90 days: +10, 180 days: +5): max +15
    - Community engagement (stars > 50: +5, forks > 10: +5): max +10
    """
    score = 0.0
    breakdown: dict[str, int] = {}

    # Description
    if raw_repo.get("description"):
        score += 10
        breakdown["description"] = 10
    else:
        breakdown["description"] = 0

    # License
    if raw_repo.get("license"):
        score += 15
        breakdown["license"] = 15
    else:
        breakdown["license"] = 0

    # Issue tracking
    if raw_repo.get("has_issues"):
        score += 10
        breakdown["issue_tracking"] = 10
    else:
        breakdown["issue_tracking"] = 0

    # Discussions
    if raw_repo.get("has_discussions"):
        score += 10
        breakdown["discussions"] = 10
    else:
        breakdown["discussions"] = 0

    # Documentation / Homepage
    if raw_repo.get("homepage"):
        score += 5
        breakdown["homepage"] = 5
    else:
        breakdown["homepage"] = 0

    # Topics / Discoverability
    topics = raw_repo.get("topics", [])
    if topics and len(topics) > 0:
        score += 10
        breakdown["topics"] = 10
    else:
        breakdown["topics"] = 0

    # Maintenance state (not archived / disabled)
    if not raw_repo.get("archived") and not raw_repo.get("disabled"):
        score += 15
        breakdown["maintained_status"] = 15
    else:
        breakdown["maintained_status"] = 0

    # Recency of pushed code
    pushed_at_str = raw_repo.get("pushed_at") or raw_repo.get("updated_at")
    recency_points = 0
    if pushed_at_str:
        try:
            if isinstance(pushed_at_str, str):
                pushed_dt = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
            else:
                pushed_dt = pushed_at_str

            if pushed_dt.tzinfo is None:
                pushed_dt = pushed_dt.replace(tzinfo=timezone.utc)

            days_ago = (datetime.now(timezone.utc) - pushed_dt).days
            if days_ago <= 30:
                recency_points = 15
            elif days_ago <= 90:
                recency_points = 10
            elif days_ago <= 180:
                recency_points = 5
        except Exception:
            recency_points = 0
    score += recency_points
    breakdown["recency"] = recency_points

    # Community signals
    community_points = 0
    stars = raw_repo.get("stargazers_count", 0)
    forks = raw_repo.get("forks_count", 0)
    if stars >= 50:
        community_points += 5
    if forks >= 10:
        community_points += 5
    score += community_points
    breakdown["community_adoption"] = community_points

    return min(score, 100.0), breakdown


def build_comparison(repos: list[RepositoryMetadata]) -> RepositoryComparison:
    """Build a side-by-side comparison matrix for up to three repositories."""
    if not repos:
        return RepositoryComparison(repositories=[], metrics=[], summary={})

    def find_max(metric_attr: str) -> str | None:
        if not repos:
            return None
        max_val = -1
        leader: str | None = None
        for r in repos:
            val = getattr(r, metric_attr, 0) or 0
            if val > max_val:
                max_val = val
                leader = r.full_name
        return leader

    def find_most_recent(metric_attr: str) -> str | None:
        if not repos:
            return None
        latest_dt: datetime | None = None
        leader: str | None = None
        for r in repos:
            dt = getattr(r, metric_attr, None)
            if dt:
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                if latest_dt is None or dt > latest_dt:
                    latest_dt = dt
                    leader = r.full_name
        return leader

    def get_license_label(r: RepositoryMetadata) -> str:
        if not r.license:
            return "None"
        return r.license.spdx_id or r.license.name or "None"

    metrics: list[ComparisonMetric] = [
        ComparisonMetric(
            key="stargazers_count",
            label="Stars",
            values={r.full_name: r.stargazers_count for r in repos},
            best_repo=find_max("stargazers_count"),
            format="number",
        ),
        ComparisonMetric(
            key="forks_count",
            label="Forks",
            values={r.full_name: r.forks_count for r in repos},
            best_repo=find_max("forks_count"),
            format="number",
        ),
        ComparisonMetric(
            key="health_score",
            label="Health Score",
            values={r.full_name: round(r.health_score, 1) for r in repos},
            best_repo=find_max("health_score"),
            format="percent",
        ),
        ComparisonMetric(
            key="open_issues_count",
            label="Open Issues",
            values={r.full_name: r.open_issues_count for r in repos},
            best_repo=None,  # Open issues count isn't strictly 'higher is better'
            format="number",
        ),
        ComparisonMetric(
            key="primary_language",
            label="Primary Language",
            values={r.full_name: r.language or "Unknown" for r in repos},
            best_repo=None,
            format="string",
        ),
        ComparisonMetric(
            key="license",
            label="License",
            values={r.full_name: get_license_label(r) for r in repos},
            best_repo=None,
            format="string",
        ),
        ComparisonMetric(
            key="pushed_at",
            label="Last Code Push",
            values={r.full_name: r.pushed_at.isoformat() if r.pushed_at else "Never" for r in repos},
            best_repo=find_most_recent("pushed_at"),
            format="date",
        ),
        ComparisonMetric(
            key="size_kb",
            label="Repository Size",
            values={r.full_name: f"{r.size_kb:,} KB" for r in repos},
            best_repo=None,
            format="string",
        ),
    ]

    summary = {
        "most_starred": find_max("stargazers_count"),
        "most_forked": find_max("forks_count"),
        "highest_health": find_max("health_score"),
        "most_active": find_most_recent("pushed_at"),
    }

    return RepositoryComparison(
        repositories=repos,
        metrics=metrics,
        summary=summary,
    )
