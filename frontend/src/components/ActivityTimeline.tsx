import React, { useState } from 'react';
import { GitCommit, Tag, ExternalLink, Calendar, User, Package, Download } from 'lucide-react';
import { ActivityStream } from '../types/github';

interface ActivityTimelineProps {
  activity: ActivityStream | null;
  isLoading: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activity, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'commits' | 'releases'>('commits');

  if (isLoading) {
    return (
      <div className="bg-orbit-surface border border-orbit-border rounded-xl p-6 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-orbit-subtle rounded w-1/4 mx-auto" />
          <div className="h-10 bg-orbit-subtle rounded w-full" />
          <div className="h-10 bg-orbit-subtle rounded w-full" />
        </div>
      </div>
    );
  }

  if (!activity) return null;

  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'Unknown date';
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
    <div className="bg-orbit-surface border border-orbit-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-orbit-border/50 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('commits')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeTab === 'commits'
                ? 'bg-orbit-accent/15 text-orbit-accent border border-orbit-accent/30'
                : 'text-orbit-muted hover:text-orbit-text'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Recent Commits ({activity.commits.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('releases')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              activeTab === 'releases'
                ? 'bg-orbit-accent/15 text-orbit-accent border border-orbit-accent/30'
                : 'text-orbit-muted hover:text-orbit-text'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Releases ({activity.releases.length})</span>
          </button>
        </div>
      </div>

      {/* Commits View */}
      {activeTab === 'commits' && (
        <div className="space-y-3">
          {activity.commits.length === 0 ? (
            <div className="text-center py-8 text-orbit-faint font-mono text-xs">
              No commit activity found or branch is empty.
            </div>
          ) : (
            <ul className="divide-y divide-orbit-border/40">
              {activity.commits.map((commit) => (
                <li
                  key={commit.sha}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs sm:text-sm text-orbit-text font-mono break-words leading-snug">
                      {commit.message.split('\n')[0]}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-orbit-faint font-mono">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {commit.author_name || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(commit.author_date)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-orbit-subtle text-orbit-muted group-hover:text-orbit-accent group-hover:border-orbit-accent/40 border border-orbit-border font-mono text-xs shrink-0 transition-colors"
                  >
                    <span>{commit.short_sha}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Releases View */}
      {activeTab === 'releases' && (
        <div className="space-y-3">
          {activity.releases.length === 0 ? (
            <div className="text-center py-8 text-orbit-faint font-mono text-xs">
              No official tagged releases published on GitHub.
            </div>
          ) : (
            <ul className="divide-y divide-orbit-border/40">
              {activity.releases.map((release) => (
                <li
                  key={release.tag_name}
                  className="py-3.5 first:pt-0 last:pb-0 space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-orbit-accent/15 text-orbit-accent border border-orbit-accent/30 font-mono text-xs font-semibold">
                        {release.tag_name}
                      </span>
                      {release.name && (
                        <span className="text-xs text-orbit-text font-medium truncate">
                          {release.name}
                        </span>
                      )}
                      {release.is_prerelease && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-950/40 text-amber-400 text-[10px] font-mono border border-amber-900/40">
                          Pre-release
                        </span>
                      )}
                    </div>

                    <a
                      href={release.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-orbit-muted hover:text-orbit-accent flex items-center gap-1 transition-colors"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(release.published_at || release.created_at)}</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>

                  {/* Assets count / list */}
                  {release.assets.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <Package className="w-3 h-3 text-orbit-faint" />
                      <span className="text-[11px] font-mono text-orbit-faint">
                        {release.assets.length} binary asset{release.assets.length > 1 ? 's' : ''}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {release.assets.slice(0, 3).map((asset) => (
                          <a
                            key={asset.name}
                            href={asset.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-orbit-muted hover:text-white px-2 py-0.5 rounded bg-orbit-subtle border border-orbit-border"
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[140px]">{asset.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
