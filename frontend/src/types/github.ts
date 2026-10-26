export interface LicenseInfo {
  key: string;
  name: string;
  spdx_id: string | null;
  url: string | null;
}

export interface HealthComponent {
  score: number;
  max_score: number;
  reason: string;
}

export interface HealthScoreBreakdown {
  score: number;
  level: 'High' | 'Moderate' | 'Low';
  components: Record<string, HealthComponent>;
}

export interface LanguageShare {
  name: string;
  bytes: number;
  percentage: number;
  color?: string;
}

export interface RepositoryMetadata {
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  language: string | null;
  languages: LanguageShare[];
  license: LicenseInfo | null;
  default_branch: string;
  is_fork: boolean;
  is_archived: boolean;
  is_template: boolean;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  size_kb: number;
  health_score: number;
  health_breakdown: HealthScoreBreakdown;
}

export interface CommitItem {
  sha: string;
  short_sha: string;
  message: string;
  author_name: string | null;
  author_avatar: string | null;
  author_date: string | null;
  html_url: string;
}

export interface ReleaseAsset {
  name: string;
  size: number;
  download_count: number;
  download_url: string;
}

export interface ReleaseItem {
  tag_name: string;
  name: string | null;
  body: string | null;
  created_at: string;
  published_at: string | null;
  is_prerelease: boolean;
  is_draft: boolean;
  html_url: string;
  assets: ReleaseAsset[];
}

export interface ActivityStream {
  owner: string;
  repo: string;
  commits: CommitItem[];
  releases: ReleaseItem[];
}

export interface ComparisonMetric {
  key: string;
  label: string;
  values: Record<string, string | number>;
  best_repo: string | null;
  format: 'number' | 'percent' | 'string' | 'date';
}

export interface RepositoryComparison {
  repositories: RepositoryMetadata[];
  metrics: ComparisonMetric[];
  summary: Record<string, unknown>;
}

export interface SearchRepoItem {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  pushed_at: string | null;
}

export interface SearchResult {
  total_count: number;
  items: SearchRepoItem[];
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset_timestamp: number | null;
  reset_time: string | null;
  is_authenticated: boolean;
  tier: string;
}
