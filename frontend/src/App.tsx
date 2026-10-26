import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { SearchHistoryBar } from './components/SearchHistoryBar';
import { RepoDetailView } from './components/RepoDetailView';
import { ComparisonView } from './components/ComparisonView';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { useSearchHistory } from './hooks/useSearchHistory';
import { useComparison } from './hooks/useComparison';
import { api, ApiError } from './services/api';
import {
  ActivityStream,
  RateLimitStatus,
  RepositoryMetadata,
} from './types/github';

export const App: React.FC = () => {
  const [currentRepo, setCurrentRepo] = useState<RepositoryMetadata | null>(null);
  const [activity, setActivity] = useState<ActivityStream | null>(null);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [viewMode, setViewMode] = useState<'detail' | 'compare' | 'idle'>('idle');
  const activeRepoRef = useRef<string>('');

  const { history, addHistoryItem, removeHistoryItem, clearHistory } = useSearchHistory();
  const {
    selectedRepos,
    toggleRepo,
    addRepo,
    removeRepo,
    isSelected,
  } = useComparison();

  // Load initial rate limit
  const refreshRateLimit = useCallback(async () => {
    try {
      const data = await api.getRateLimit();
      setRateLimit(data);
    } catch {
      // Backend may be offline or starting up
    }
  }, []);

  useEffect(() => {
    refreshRateLimit();
  }, [refreshRateLimit]);

  // Load repository by owner and repo
  const loadRepository = useCallback(
    async (owner: string, repo: string) => {
      const identifier = `${owner}/${repo}`.toLowerCase();
      if (activeRepoRef.current === identifier && currentRepo) {
        setViewMode('detail');
        return;
      }
      activeRepoRef.current = identifier;
      setIsLoadingRepo(true);
      setError(null);
      setViewMode('detail');

      try {
        // Fetch metadata
        const metadata = await api.getRepository(owner, repo);
        setCurrentRepo(metadata);
        addHistoryItem(identifier);
        refreshRateLimit();

        // Asynchronously fetch activity without blocking main metadata render
        setIsLoadingActivity(true);
        api
          .getActivity(owner, repo)
          .then((act) => {
            setActivity(act);
            refreshRateLimit();
          })
          .catch(() => {
            setActivity(null);
          })
          .finally(() => {
            setIsLoadingActivity(false);
          });
      } catch (err: unknown) {
        activeRepoRef.current = '';
        if (err instanceof ApiError) {
          setError(err);
        } else {
          setError(new ApiError(err instanceof Error ? err.message : 'Unknown error occurred', 500));
        }
        setCurrentRepo(null);
        setActivity(null);
      } finally {
        setIsLoadingRepo(false);
      }
    },
    [addHistoryItem, currentRepo, refreshRateLimit]
  );

  // Sync hash routing on initial load
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash.startsWith('repo=')) {
        const full = hash.replace('repo=', '');
        const parts = full.split('/');
        if (parts.length === 2 && parts[0] && parts[1]) {
          loadRepository(parts[0], parts[1]);
        }
      } else if (hash === 'compare') {
        setViewMode('compare');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [loadRepository]);

  const handleSelectFromHistory = (identifier: string) => {
    const parts = identifier.split('/');
    if (parts.length === 2) {
      window.location.hash = `repo=${identifier}`;
      loadRepository(parts[0], parts[1]);
    }
  };

  const handleSelectRepo = (owner: string, repo: string) => {
    window.location.hash = `repo=${owner}/${repo}`;
    loadRepository(owner, repo);
  };

  const handleOpenCompare = () => {
    setViewMode('compare');
    window.location.hash = 'compare';
  };

  const handleHomeClick = () => {
    activeRepoRef.current = '';
    setViewMode('idle');
    setCurrentRepo(null);
    setActivity(null);
    setError(null);
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen bg-orbit-bg text-orbit-text flex flex-col font-sans selection:bg-orbit-accent selection:text-white">
      {/* Top Navbar */}
      <Navbar
        rateLimit={rateLimit}
        compareCount={selectedRepos.length}
        onOpenCompare={handleOpenCompare}
        onHomeClick={handleHomeClick}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search Header */}
        <section className="space-y-3">
          <SearchBar
            onSelectRepo={handleSelectRepo}
            isLoading={isLoadingRepo}
          />
          <SearchHistoryBar
            history={history}
            onSelect={handleSelectFromHistory}
            onRemove={removeHistoryItem}
            onClear={clearHistory}
          />
        </section>

        {/* View Switcher: Loading, Error, Compare, Detail, or Idle */}
        <section>
          {isLoadingRepo ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState
              message={error.message}
              statusCode={error.status}
              onRetry={() => {
                if (currentRepo) {
                  loadRepository(currentRepo.owner, currentRepo.name);
                }
              }}
              onBackToHome={handleHomeClick}
            />
          ) : viewMode === 'compare' ? (
            <ComparisonView
              selectedRepos={selectedRepos}
              onRemoveRepo={removeRepo}
              onAddRepo={addRepo}
              onSelectRepoView={handleSelectRepo}
              onClose={() => {
                if (currentRepo) {
                  setViewMode('detail');
                  window.location.hash = `repo=${currentRepo.full_name}`;
                } else {
                  setViewMode('idle');
                  window.location.hash = '';
                }
              }}
            />
          ) : viewMode === 'detail' && currentRepo ? (
            <RepoDetailView
              repo={currentRepo}
              activity={activity}
              isLoadingActivity={isLoadingActivity}
              isComparing={isSelected(currentRepo.full_name)}
              onToggleCompare={() => toggleRepo(currentRepo.full_name)}
            />
          ) : (
            <EmptyState onSelectSample={handleSelectRepo} />
          )}
        </section>
      </main>

      {/* Minimal Developer Footer */}
      <footer className="border-t border-orbit-border/60 py-6 text-xs font-mono text-orbit-faint">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ORBIT OSINT ENGINE • v0.1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/nyxrv0id/orbit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orbit-muted transition-colors"
            >
              github.com/nyxrv0id/orbit
            </a>
            <span>•</span>
            <span>MIT LICENSE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
