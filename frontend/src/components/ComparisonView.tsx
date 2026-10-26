import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Loader2,
  Trophy,
  ExternalLink,
  AlertTriangle,
  GitCompare,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { RepositoryComparison } from '../types/github';

interface ComparisonViewProps {
  selectedRepos: string[];
  onRemoveRepo: (repo: string) => void;
  onAddRepo: (repo: string) => void;
  onSelectRepoView: (owner: string, repo: string) => void;
  onClose: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  selectedRepos,
  onRemoveRepo,
  onAddRepo,
  onSelectRepoView,
  onClose,
}) => {
  const [comparison, setComparison] = useState<RepositoryComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRepoInput, setNewRepoInput] = useState('');

  useEffect(() => {
    if (selectedRepos.length === 0) {
      setComparison(null);
      return;
    }

    const fetchComparison = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.compareRepositories(selectedRepos);
        setComparison(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to compare repositories.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
  }, [selectedRepos]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoInput.trim()) return;
    onAddRepo(newRepoInput.trim());
    setNewRepoInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-orbit-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orbit-accent/15 border border-orbit-accent/30 flex items-center justify-center text-orbit-accent">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono tracking-tight">
              Repository Comparison Matrix
            </h2>
            <p className="text-xs text-orbit-muted">
              Benchmark metrics, activity, and stewardship side-by-side (max 3)
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg border border-orbit-border bg-orbit-surface text-orbit-muted hover:text-white hover:border-orbit-accent/40 transition-colors"
          title="Back to repository detail or search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Input to add another repo if < 3 */}
      {selectedRepos.length < 3 && (
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2 max-w-md">
          <input
            type="text"
            value={newRepoInput}
            onChange={(e) => setNewRepoInput(e.target.value)}
            placeholder="Add repo to compare (e.g. pallets/flask)..."
            className="flex-1 bg-orbit-surface border border-orbit-border rounded-lg px-3 py-2 text-xs font-mono text-orbit-text placeholder-orbit-faint focus:outline-none focus:border-orbit-accent"
          />
          <button
            type="submit"
            disabled={!newRepoInput.trim()}
            className="px-3 py-2 bg-orbit-subtle hover:bg-orbit-accent hover:text-white text-orbit-muted border border-orbit-border hover:border-orbit-accent rounded-lg text-xs font-mono flex items-center gap-1 transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      )}

      {/* Empty State */}
      {selectedRepos.length === 0 && (
        <div className="text-center py-16 border border-dashed border-orbit-border rounded-xl">
          <GitCompare className="w-10 h-10 text-orbit-faint mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-orbit-text font-mono">
            No repositories selected for comparison
          </h3>
          <p className="text-xs text-orbit-muted mt-1 max-w-sm mx-auto">
            Scan a repository and click &quot;Add to Compare&quot; or enter repository identifiers above.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-20 text-center">
          <Loader2 className="w-7 h-7 text-orbit-accent animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-orbit-muted">
            Gathering side-by-side telemetry and metrics...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 rounded-xl border border-rose-950/60 bg-rose-950/20 text-rose-300 flex items-start gap-3 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Comparison Error</span>
            <p className="text-rose-400/80">{error}</p>
          </div>
        </div>
      )}

      {/* Comparison Matrix Table */}
      {!isLoading && comparison && comparison.repositories.length > 0 && (
        <div className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden shadow-lg">
          {/* Header row with Repos */}
          <div
            className="grid divide-x divide-orbit-border border-b border-orbit-border bg-orbit-card"
            style={{
              gridTemplateColumns: `180px repeat(${comparison.repositories.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="p-4 font-mono text-xs font-semibold text-orbit-faint uppercase tracking-wider flex items-center">
              Repository
            </div>

            {comparison.repositories.map((repo) => (
              <div key={repo.full_name} className="p-4 space-y-2 relative group">
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onSelectRepoView(repo.owner, repo.name)}
                    className="text-left font-mono font-bold text-sm text-orbit-text hover:text-orbit-accent transition-colors truncate"
                  >
                    {repo.full_name}
                  </button>
                  <button
                    onClick={() => onRemoveRepo(repo.full_name)}
                    className="p-1 rounded text-orbit-faint hover:text-rose-400 hover:bg-orbit-subtle transition-colors shrink-0"
                    title={`Remove ${repo.full_name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-orbit-muted line-clamp-2 min-h-[32px]">
                  {repo.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-orbit-accent hover:underline"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <button
                    onClick={() => onSelectRepoView(repo.owner, repo.name)}
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-orbit-muted hover:text-white"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Metric Rows */}
          <div className="divide-y divide-orbit-border/60">
            {comparison.metrics.map((metric) => (
              <div
                key={metric.key}
                className="grid divide-x divide-orbit-border/50 hover:bg-orbit-subtle/30 transition-colors"
                style={{
                  gridTemplateColumns: `180px repeat(${comparison.repositories.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="p-3.5 text-xs font-mono text-orbit-muted flex items-center bg-orbit-surface/50">
                  {metric.label}
                </div>

                {comparison.repositories.map((repo) => {
                  const val = metric.values[repo.full_name];
                  const isLeader = metric.best_repo === repo.full_name;

                  return (
                    <div
                      key={repo.full_name}
                      className={`p-3.5 flex items-center justify-between text-xs font-mono ${
                        isLeader ? 'bg-orbit-accent/5 font-semibold text-white' : 'text-orbit-text'
                      }`}
                    >
                      <span>
                        {typeof val === 'number'
                          ? metric.format === 'percent'
                            ? `${val}%`
                            : val.toLocaleString()
                          : String(val ?? '—')}
                      </span>

                      {isLeader && (
                        <span
                          className="flex items-center gap-1 text-[10px] text-orbit-accent bg-orbit-accent/15 px-1.5 py-0.5 rounded border border-orbit-accent/30"
                          title="Highest value in comparison"
                        >
                          <Trophy className="w-2.5 h-2.5" />
                          <span>Leader</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
