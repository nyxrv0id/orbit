import React, { useState } from 'react';
import {
  Star,
  GitFork,
  AlertCircle,
  Eye,
  Calendar,
  ExternalLink,
  Code,
  Shield,
  Layers,
  GitCompare,
  Copy,
  Check,
  Archive,
  Terminal,
} from 'lucide-react';
import { ActivityStream, RepositoryMetadata } from '../types/github';
import { HealthScoreCard } from './HealthScoreCard';
import { LanguageBar } from './LanguageBar';
import { ActivityTimeline } from './ActivityTimeline';

interface RepoDetailViewProps {
  repo: RepositoryMetadata;
  activity: ActivityStream | null;
  isLoadingActivity: boolean;
  isComparing: boolean;
  onToggleCompare: () => void;
}

export const RepoDetailView: React.FC<RepoDetailViewProps> = ({
  repo,
  activity,
  isLoadingActivity,
  isComparing,
  onToggleCompare,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const copyCloneCmd = () => {
    navigator.clipboard.writeText(`git clone ${repo.html_url}.git`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Card */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl p-6 shadow-md relative overflow-hidden">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orbit-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1 min-w-0">
            {/* Owner / Name & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-orbit-muted font-mono text-base sm:text-lg">
                {repo.owner} /
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight break-all">
                {repo.name}
              </h1>

              {repo.is_archived && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/40 text-xs font-mono">
                  <Archive className="w-3 h-3" />
                  <span>Archived</span>
                </span>
              )}

              {repo.is_fork && (
                <span className="px-2 py-0.5 rounded bg-orbit-subtle text-orbit-muted border border-orbit-border text-xs font-mono">
                  Fork
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-orbit-text/90 leading-relaxed max-w-3xl">
              {repo.description || 'No repository description provided.'}
            </p>

            {/* Metadata tags */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-orbit-muted pt-1">
              {repo.license && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orbit-subtle border border-orbit-border">
                  <Shield className="w-3.5 h-3.5 text-orbit-accent" />
                  <span>{repo.license.spdx_id || repo.license.name}</span>
                </span>
              )}

              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orbit-subtle border border-orbit-border">
                <Code className="w-3.5 h-3.5 text-orbit-accent" />
                <span>{repo.default_branch}</span>
              </span>

              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orbit-subtle border border-orbit-border">
                <Layers className="w-3.5 h-3.5 text-orbit-accent" />
                <span>{repo.size_kb.toLocaleString()} KB</span>
              </span>

              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orbit-subtle border border-orbit-border">
                <Calendar className="w-3.5 h-3.5 text-orbit-accent" />
                <span>Pushed {formatDate(repo.pushed_at)}</span>
              </span>
            </div>

            {/* Topics */}
            {repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {repo.topics.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-orbit-card border border-orbit-border/60 text-orbit-muted hover:text-orbit-text transition-colors"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={onToggleCompare}
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-2 border transition-all ${
                isComparing
                  ? 'bg-orbit-accent text-white border-orbit-accent shadow-md shadow-orbit-accent/20'
                  : 'bg-orbit-card text-orbit-text border-orbit-border hover:border-orbit-accent/50'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{isComparing ? 'Comparing' : 'Add to Compare'}</span>
            </button>

            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg text-xs font-mono font-medium bg-orbit-card hover:bg-orbit-subtle text-orbit-text border border-orbit-border hover:border-orbit-border/80 flex items-center justify-center gap-2 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={copyCloneCmd}
              className="px-3.5 py-2 rounded-lg text-xs font-mono font-medium bg-orbit-card hover:bg-orbit-subtle text-orbit-muted hover:text-white border border-orbit-border flex items-center justify-center gap-2 transition-colors"
              title="Copy git clone command"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>git clone</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowJson(!showJson)}
              className="px-3.5 py-2 rounded-lg text-xs font-mono font-medium bg-orbit-card hover:bg-orbit-subtle text-orbit-muted hover:text-white border border-orbit-border flex items-center justify-center gap-2 transition-colors"
              title="Toggle raw telemetry JSON"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showJson ? 'Hide JSON' : 'Raw Telemetry'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Raw JSON viewer */}
      {showJson && (
        <div className="bg-orbit-surface border border-orbit-border rounded-xl p-4 text-xs font-mono overflow-x-auto max-h-96">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-orbit-border/50 text-orbit-faint">
            <span>RAW_PAYLOAD_TELEMETRY.json</span>
            <span>{JSON.stringify(repo).length} bytes</span>
          </div>
          <pre className="text-orbit-muted">{JSON.stringify(repo, null, 2)}</pre>
        </div>
      )}

      {/* Key Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-orbit-surface border border-orbit-border rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-orbit-muted">
            <span>Stars</span>
            <Star className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {repo.stargazers_count.toLocaleString()}
          </div>
          <p className="text-[11px] text-orbit-faint font-mono">Public bookmarks</p>
        </div>

        <div className="bg-orbit-surface border border-orbit-border rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-orbit-muted">
            <span>Forks</span>
            <GitFork className="w-3.5 h-3.5 text-orbit-accent" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {repo.forks_count.toLocaleString()}
          </div>
          <p className="text-[11px] text-orbit-faint font-mono">Network derivatives</p>
        </div>

        <div className="bg-orbit-surface border border-orbit-border rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-orbit-muted">
            <span>Open Issues</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {repo.open_issues_count.toLocaleString()}
          </div>
          <p className="text-[11px] text-orbit-faint font-mono">Issues & PR backlog</p>
        </div>

        <div className="bg-orbit-surface border border-orbit-border rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-orbit-muted">
            <span>Watchers</span>
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            {repo.subscribers_count.toLocaleString()}
          </div>
          <p className="text-[11px] text-orbit-faint font-mono">Notification subscribers</p>
        </div>
      </div>

      {/* Health Score Breakdown Card */}
      <HealthScoreCard
        breakdown={repo.health_breakdown}
        healthScore={repo.health_score}
      />

      {/* Language Breakdown */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-orbit-border/50 pb-3">
          <h3 className="text-sm font-semibold text-white tracking-wide font-mono uppercase">
            Language Composition
          </h3>
          <span className="text-xs font-mono text-orbit-faint">
            {repo.languages.length} Language{repo.languages.length !== 1 ? 's' : ''} detected
          </span>
        </div>
        <LanguageBar languages={repo.languages} />
      </div>

      {/* Activity Timeline (Commits & Releases) */}
      <ActivityTimeline
        activity={activity}
        isLoading={isLoadingActivity}
      />
    </div>
  );
};
