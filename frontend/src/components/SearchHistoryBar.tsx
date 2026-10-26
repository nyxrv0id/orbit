import React from 'react';
import { History, X, Trash2 } from 'lucide-react';
import { HistoryItem } from '../hooks/useSearchHistory';

interface SearchHistoryBarProps {
  history: HistoryItem[];
  onSelect: (identifier: string) => void;
  onRemove: (identifier: string) => void;
  onClear: () => void;
}

export const SearchHistoryBar: React.FC<SearchHistoryBarProps> = ({
  history,
  onSelect,
  onRemove,
  onClear,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-4">
      <div className="flex items-center justify-between text-xs text-orbit-faint font-mono mb-2 px-1">
        <span className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          <span>RECENT SCANS</span>
        </span>
        <button
          onClick={onClear}
          className="hover:text-orbit-muted transition-colors flex items-center gap-1"
          title="Clear search history"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {history.map((item) => (
          <div
            key={item.identifier}
            className="group flex items-center bg-orbit-surface border border-orbit-border rounded-lg text-xs font-mono transition-all hover:border-orbit-accent/40"
          >
            <button
              onClick={() => onSelect(item.identifier)}
              className="px-2.5 py-1 text-orbit-muted hover:text-orbit-text transition-colors"
            >
              {item.identifier}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.identifier);
              }}
              className="pr-2 pl-0.5 text-orbit-faint hover:text-rose-400 transition-colors"
              title={`Remove ${item.identifier}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
