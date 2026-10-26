import React from 'react';
import { AlertOctagon, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  statusCode?: number;
  onRetry?: () => void;
  onBackToHome?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  statusCode,
  onRetry,
  onBackToHome,
}) => {
  const isRateLimit = statusCode === 429 || message.toLowerCase().includes('rate limit');
  const isNotFound = statusCode === 404 || message.toLowerCase().includes('not found');

  return (
    <div className="max-w-lg mx-auto my-12 bg-orbit-surface border border-orbit-border rounded-xl p-6 text-center space-y-5 shadow-xl">
      <div className="w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-400 flex items-center justify-center mx-auto">
        {isRateLimit ? <KeyRound className="w-6 h-6" /> : <AlertOctagon className="w-6 h-6" />}
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold font-mono text-white">
          {isRateLimit
            ? 'GitHub API Rate Limit Reached'
            : isNotFound
            ? 'Repository Not Found'
            : 'Investigation Failed'}
        </h3>
        <p className="text-xs text-orbit-muted font-mono leading-relaxed">{message}</p>
      </div>

      {isRateLimit && (
        <div className="p-3 bg-orbit-card rounded-lg border border-orbit-border text-left text-xs font-mono text-orbit-muted space-y-1">
          <p className="text-white font-medium">To increase rate limits:</p>
          <p>
            Add a personal GitHub token to <code className="text-orbit-accent">backend/.env</code> as{' '}
            <code className="text-orbit-accent">GITHUB_TOKEN=ghp_...</code> to raise your quota from 60
            to 5,000 requests/hour.
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 pt-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-orbit-accent hover:bg-orbit-accent-hover text-white text-xs font-mono font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Query</span>
          </button>
        )}
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-orbit-card hover:bg-orbit-subtle text-orbit-muted hover:text-white border border-orbit-border text-xs font-mono font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
        )}
      </div>
    </div>
  );
};
