import React from 'react';
import { Activity, ShieldCheck, FileText, GitCommit, CheckCircle2 } from 'lucide-react';
import { HealthScoreBreakdown } from '../types/github';

interface HealthScoreCardProps {
  breakdown: HealthScoreBreakdown;
  healthScore: number;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ breakdown, healthScore }) => {
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60';
      case 'Moderate':
        return 'bg-amber-950/40 text-amber-400 border-amber-900/60';
      default:
        return 'bg-rose-950/40 text-rose-400 border-rose-900/60';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'maintenance':
        return <Activity className="w-4 h-4 text-orbit-accent" />;
      case 'community':
        return <GitCommit className="w-4 h-4 text-orbit-accent" />;
      case 'documentation':
        return <FileText className="w-4 h-4 text-orbit-accent" />;
      case 'stability':
        return <ShieldCheck className="w-4 h-4 text-orbit-accent" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-orbit-accent" />;
    }
  };

  const getCategoryTitle = (key: string) => {
    switch (key) {
      case 'maintenance':
        return 'Maintenance & Velocity';
      case 'community':
        return 'Community Engagement';
      case 'documentation':
        return 'Governance & Docs';
      case 'stability':
        return 'Stability & Maturity';
      default:
        return key.toUpperCase();
    }
  };

  return (
    <div className="bg-orbit-surface border border-orbit-border rounded-xl p-5 shadow-sm space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-orbit-border/50 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide font-mono uppercase">
            Repository Health Index
          </h3>
          <p className="text-xs text-orbit-muted mt-0.5">
            Algorithmic score evaluating activity, stewardship, and sustainability
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-3xl font-mono font-bold ${getScoreColor(healthScore)}`}>
              {Math.round(healthScore)}
            </span>
            <span className="text-xs text-orbit-faint font-mono">/100</span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${getBadgeStyle(
              breakdown.level
            )}`}
          >
            {breakdown.level}
          </span>
        </div>
      </div>

      {/* Component Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {Object.entries(breakdown.components).map(([key, comp]) => {
          const percentage = (comp.score / comp.max_score) * 100;
          return (
            <div
              key={key}
              className="bg-orbit-subtle/50 border border-orbit-border/70 rounded-lg p-3.5 space-y-2 hover:border-orbit-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-orbit-text font-medium">
                  {getCategoryIcon(key)}
                  <span>{getCategoryTitle(key)}</span>
                </div>
                <span className="text-orbit-muted">
                  {comp.score} / {comp.max_score} pts
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full bg-orbit-card h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-orbit-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                />
              </div>

              <p className="text-xs text-orbit-muted leading-relaxed">{comp.reason}</p>
            </div>
          );
        })}
      </div>

      {/* Methodology Disclaimer Note */}
      <div className="pt-2 border-t border-orbit-border/40 text-[11px] text-orbit-faint font-mono">
        * Automated OSS hygiene heuristic computed from GitHub telemetry. Does not guarantee software defect rates or individual maintainer responsiveness.
      </div>
    </div>
  );
};
