import {
  ActivityStream,
  RateLimitStatus,
  RepositoryComparison,
  RepositoryMetadata,
  SearchResult,
  LanguageShare,
} from '../types/github';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      let errorDetail = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData) {
          if (typeof errorData.detail === 'string') {
            errorDetail = errorData.detail;
          } else if (typeof errorData.message === 'string') {
            errorDetail = errorData.message;
          } else if (errorData.detail) {
            errorDetail = JSON.stringify(errorData.detail);
          }
        }
      } catch {
        if (res.statusText) {
          errorDetail = res.statusText;
        }
      }
      throw new ApiError(errorDetail, res.status);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(message, 0);
  }
}

// Normalization helpers to ensure resilient rendering across API payload variants
function normalizeLanguages(rawLanguages: unknown): LanguageShare[] {
  if (Array.isArray(rawLanguages)) {
    return rawLanguages;
  }
  if (rawLanguages && typeof rawLanguages === 'object') {
    const entries = Object.entries(rawLanguages as Record<string, number>);
    const total = entries.reduce((sum, [, bytes]) => sum + (Number(bytes) || 0), 0) || 1;
    return entries.map(([name, bytes]) => {
      const numBytes = Number(bytes) || 0;
      return {
        name,
        bytes: numBytes,
        percentage: Math.round((numBytes / total) * 1000) / 10,
      };
    });
  }
  return [];
}

function normalizeHealthBreakdown(
  healthScore: number,
  rawBreakdown: any
): RepositoryMetadata['health_breakdown'] {
  if (rawBreakdown && typeof rawBreakdown === 'object' && rawBreakdown.components) {
    return rawBreakdown;
  }

  const b = rawBreakdown && typeof rawBreakdown === 'object' ? rawBreakdown : {};
  const score = Math.round(Number(healthScore) || 0);
  const level: 'High' | 'Moderate' | 'Low' =
    score >= 75 ? 'High' : score >= 50 ? 'Moderate' : 'Low';

  const maintScore = (Number(b.maintained_status) || 0) + (Number(b.recency) || 0);
  const maintReason =
    b.maintained_status === 0
      ? 'Repository is archived or inactive.'
      : b.recency >= 15
      ? 'High code velocity with pushes within 30 days.'
      : b.recency >= 10
      ? 'Active maintenance with code pushed within 90 days.'
      : 'Infrequent commit activity over the past 6 months.';

  const commScore =
    (Number(b.community_adoption) || 0) +
    (Number(b.discussions) || 0) +
    (b.issue_tracking ? 5 : 0);
  const commReason =
    (Number(b.community_adoption) || 0) >= 10
      ? 'Strong community adoption with established stars and fork network.'
      : 'Emerging or niche community adoption.';

  const docScore = (Number(b.license) || 0) + (Number(b.description) || 0);
  const docReason = b.license
    ? 'Standard open-source license and project description provided.'
    : 'Missing standard open-source license or minimal project documentation.';

  const stabScore =
    (Number(b.homepage) || 0) + (Number(b.topics) || 0) + (b.issue_tracking ? 5 : 0);
  const stabReason = b.topics
    ? 'Structured discoverability with verified topic taxonomy.'
    : 'Basic repository structure without specialized topics.';

  return {
    score,
    level,
    components: {
      maintenance: { score: maintScore, max_score: 30, reason: maintReason },
      community: { score: commScore, max_score: 25, reason: commReason },
      documentation: { score: docScore, max_score: 25, reason: docReason },
      stability: { score: Math.min(20, stabScore), max_score: 20, reason: stabReason },
    },
  };
}

function normalizeRepository(data: any): RepositoryMetadata {
  const ownerStr =
    typeof data.owner === 'object' && data.owner !== null
      ? data.owner.login || 'unknown'
      : String(data.owner || 'unknown');

  const healthScore = typeof data.health_score === 'number' ? data.health_score : 0;

  return {
    owner: ownerStr,
    name: data.name || '',
    full_name: data.full_name || `${ownerStr}/${data.name || ''}`,
    description: data.description || null,
    html_url: data.html_url || `https://github.com/${ownerStr}/${data.name || ''}`,
    homepage: data.homepage || null,
    stargazers_count: Number(data.stargazers_count) || 0,
    forks_count: Number(data.forks_count) || 0,
    open_issues_count: Number(data.open_issues_count) || 0,
    subscribers_count: Number(data.subscribers_count ?? data.watchers_count) || 0,
    language: data.language || null,
    languages: normalizeLanguages(data.languages),
    license: data.license || null,
    default_branch: data.default_branch || 'main',
    is_fork: Boolean(data.fork ?? data.is_fork),
    is_archived: Boolean(data.archived ?? data.is_archived),
    is_template: Boolean(data.is_template),
    topics: Array.isArray(data.topics) ? data.topics : [],
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    pushed_at: data.pushed_at || null,
    size_kb: Number(data.size_kb ?? data.size) || 0,
    health_score: healthScore,
    health_breakdown: normalizeHealthBreakdown(healthScore, data.health_breakdown),
  };
}

export const api = {
  async getHealth(): Promise<{ status: string; version: string; service: string }> {
    return request('/health');
  },

  async getRateLimit(): Promise<RateLimitStatus> {
    const raw: any = await request('/rate-limit');
    return {
      limit: Number(raw.limit) || 60,
      remaining: Number(raw.remaining) ?? 60,
      reset_timestamp: raw.reset_timestamp || null,
      reset_time: raw.reset_datetime || raw.reset_time || null,
      is_authenticated: Boolean(raw.authenticated ?? raw.is_authenticated),
      tier: (raw.authenticated ?? raw.is_authenticated) ? 'Authenticated' : 'Public Quota',
    };
  },

  async getRepository(owner: string, repo: string): Promise<RepositoryMetadata> {
    const raw = await request(`/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    return normalizeRepository(raw);
  },

  async getActivity(owner: string, repo: string): Promise<ActivityStream> {
    const raw: any = await request(
      `/repo/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/activity`
    );

    const rawCommits = raw.recent_commits || raw.commits || [];
    const rawReleases = raw.recent_releases || raw.releases || [];

    const commits = rawCommits.map((c: any) => ({
      sha: c.sha || '',
      short_sha: (c.sha || '').slice(0, 7),
      message: c.message || 'Commit',
      author_name: c.author_name || null,
      author_avatar: c.author_avatar || null,
      author_date: c.date || c.author_date || null,
      html_url: c.html_url || `https://github.com/${owner}/${repo}/commit/${c.sha}`,
    }));

    const releases = rawReleases.map((r: any) => ({
      tag_name: r.tag_name || '',
      name: r.name || r.tag_name || '',
      body: r.body || null,
      created_at: r.created_at || r.published_at || '',
      published_at: r.published_at || r.created_at || null,
      is_prerelease: Boolean(r.prerelease ?? r.is_prerelease),
      is_draft: Boolean(r.draft ?? r.is_draft),
      html_url: r.html_url || `https://github.com/${owner}/${repo}/releases/tag/${r.tag_name}`,
      assets: (r.assets || []).map((a: any) => ({
        name: a.name || 'asset',
        size: Number(a.size) || 0,
        download_count: Number(a.download_count) || 0,
        download_url: a.browser_download_url || a.download_url || '',
      })),
    }));

    return {
      owner,
      repo,
      commits,
      releases,
    };
  },

  async compareRepositories(repos: string[]): Promise<RepositoryComparison> {
    const query = repos.map((r) => `repos=${encodeURIComponent(r)}`).join('&');
    const raw: any = await request(`/compare?${query}`);

    return {
      repositories: (raw.repositories || []).map(normalizeRepository),
      metrics: raw.metrics || [],
      summary: raw.summary || {},
    };
  },

  async search(query: string, perPage: number = 8): Promise<SearchResult> {
    const raw: any = await request(`/search?q=${encodeURIComponent(query)}&per_page=${perPage}`);
    const items = (raw.items || []).map((item: any) => ({
      full_name: item.full_name || `${item.owner_login}/${item.name}`,
      description: item.description || null,
      stargazers_count: Number(item.stargazers_count) || 0,
      language: item.language || null,
      pushed_at: item.pushed_at || item.updated_at || null,
    }));

    return {
      total_count: raw.total_count || items.length,
      items,
    };
  },
};
