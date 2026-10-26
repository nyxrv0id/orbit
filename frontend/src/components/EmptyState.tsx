import React from 'react';
import { Terminal, Compass, Star, ArrowUpRight } from 'lucide-react';

interface EmptyStateProps {
  onSelectSample: (owner: string, repo: string) => void;
}

const FEATURED_REPOSITORIES = [
  {
    owner: 'tiangolo',
    repo: 'fastapi',
    description: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production.',
    stars: '80k+',
    lang: 'Python',
  },
  {
    owner: 'torvalds',
    repo: 'linux',
    description: 'Linux kernel source tree by Linus Torvalds.',
    stars: '190k+',
    lang: 'C',
  },
  {
    owner: 'neovim',
    repo: 'neovim',
    description: 'Vim-fork focused on extensibility and usability.',
    stars: '85k+',
    lang: 'Lua / C',
  },
  {
    owner: 'facebook',
    repo: 'react',
    description: 'The library for web and native user interfaces.',
    stars: '230k+',
    lang: 'JavaScript',
  },
  {
    owner: 'kubernetes',
    repo: 'kubernetes',
    description: 'Production-Grade Container Scheduling and Management.',
    stars: '115k+',
    lang: 'Go',
  },
  {
    owner: 'astral-sh',
    repo: 'uv',
    description: 'An extremely fast Python package and project manager, written in Rust.',
    stars: '45k+',
    lang: 'Rust',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectSample }) => {
  return (
    <div className="space-y-12 py-6">
      {/* Hero Welcome */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orbit-subtle border border-orbit-border text-xs font-mono text-orbit-accent">
          <Terminal className="w-3.5 h-3.5" />
          <span>v0.1.0 OSINT Engine Online</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
          Inspect, Benchmark & Audit Any Public Repository
        </h2>
        <p className="text-sm text-orbit-muted leading-relaxed">
          Orbit analyzes commit velocities, maintenance patterns, dependency health, license governance,
          and community trajectory across the open-source ecosystem.
        </p>
      </div>

      {/* Featured Radar List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-orbit-faint px-1">
          <Compass className="w-3.5 h-3.5" />
          <span>FEATURED INTELLIGENCE TARGETS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_REPOSITORIES.map((item) => (
            <button
              key={`${item.owner}/${item.repo}`}
              onClick={() => onSelectSample(item.owner, item.repo)}
              className="text-left bg-orbit-surface hover:bg-orbit-subtle/80 border border-orbit-border hover:border-orbit-accent/40 rounded-xl p-4 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-orbit-text group-hover:text-orbit-accent transition-colors truncate">
                    {item.owner}/{item.repo}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-orbit-faint group-hover:text-orbit-accent transition-colors" />
                </div>
                <p className="text-xs text-orbit-muted line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-orbit-faint pt-4 border-t border-orbit-border/40 mt-3">
                <span className="px-1.5 py-0.5 rounded bg-orbit-card border border-orbit-border text-[11px]">
                  {item.lang}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3 h-3" />
                  <span>{item.stars}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
