import React from 'react';
import { Zap, GitCompare } from 'lucide-react';
import { RateLimitStatus } from '../types/github';

interface NavbarProps {
  rateLimit: RateLimitStatus | null;
  compareCount: number;
  onOpenCompare: () => void;
  onHomeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  rateLimit,
  compareCount,
  onOpenCompare,
  onHomeClick,
}) => {
  const getRateColor = () => {
    if (!rateLimit) return 'text-orbit-muted border-orbit-border';
    if (rateLimit.remaining > 20) return 'text-emerald-400 border-emerald-950/60 bg-emerald-950/20';
    if (rateLimit.remaining > 5) return 'text-amber-400 border-amber-950/60 bg-amber-950/20';
    return 'text-rose-400 border-rose-950/60 bg-rose-950/20';
  };

  return (
    <header className="border-b border-orbit-border bg-orbit-surface/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orbit-accent rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-lg bg-orbit-subtle border border-orbit-border flex items-center justify-center text-orbit-accent group-hover:border-orbit-accent/60 transition-colors">
            <svg
              className="w-5 h-5 transition-transform group-hover:rotate-45 duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="m9.17 14.83-4.24 4.24" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white font-mono text-lg">ORBIT</span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-orbit-accent/15 text-orbit-accent border border-orbit-accent/30">
                OSINT
              </span>
            </div>
            <p className="text-xs text-orbit-muted hidden sm:block">GitHub Repository Intelligence</p>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Rate Limit Indicator */}
          {rateLimit && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono ${getRateColor()}`}
              title={
                rateLimit.reset_time
                  ? `GitHub API Rate Limit: ${rateLimit.remaining}/${rateLimit.limit} requests left. Resets at ${rateLimit.reset_time}`
                  : `GitHub API: ${rateLimit.remaining}/${rateLimit.limit} requests remaining`
              }
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {rateLimit.remaining} / {rateLimit.limit}
              </span>
              <span className="hidden md:inline text-[10px] text-orbit-faint">
                ({rateLimit.is_authenticated ? 'token' : 'public'})
              </span>
            </div>
          )}

          {/* Comparison Mode Trigger */}
          <button
            onClick={onOpenCompare}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
              compareCount > 0
                ? 'bg-orbit-accent/15 border-orbit-accent text-orbit-accent hover:bg-orbit-accent/25'
                : 'bg-orbit-card border-orbit-border text-orbit-muted hover:text-orbit-text hover:border-orbit-border/80'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
            {compareCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-orbit-accent text-white text-[11px] font-mono">
                {compareCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
