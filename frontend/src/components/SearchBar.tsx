import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Star, CornerDownLeft } from 'lucide-react';
import { api } from '../services/api';
import { SearchRepoItem } from '../types/github';

interface SearchBarProps {
  onSelectRepo: (owner: string, repo: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectRepo,
  isLoading = false,
  placeholder = 'Search repository (e.g. tiangolo/fastapi or https://github.com/torvalds/linux)...',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchRepoItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut '/' to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed.includes('/')) {
      // Don't autocomplete if it's already an exact owner/repo or too short
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await api.search(trimmed, 5);
        setSuggestions(results.items || []);
        setIsOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Clean owner/repo from URL or string
  const parseRepoIdentifier = (input: string): { owner: string; repo: string } | null => {
    let clean = input.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        const url = new URL(clean);
        if (url.hostname === 'github.com') {
          clean = url.pathname.replace(/^\/+|\/+$/g, '');
        }
      } catch {
        // Continue with raw text
      }
    }

    const parts = clean.split('/').map((s) => s.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseRepoIdentifier(query);
    if (parsed) {
      setIsOpen(false);
      onSelectRepo(parsed.owner, parsed.repo);
      return;
    }

    // If suggestions are visible and one is selected
    if (isOpen && selectedIndex >= 0 && suggestions[selectedIndex]) {
      const selected = suggestions[selectedIndex];
      const parsedSel = parseRepoIdentifier(selected.full_name);
      if (parsedSel) {
        setIsOpen(false);
        onSelectRepo(parsedSel.owner, parsedSel.repo);
        return;
      }
    }

    // If there is at least 1 suggestion, pick the first
    if (suggestions.length > 0) {
      const first = suggestions[0];
      const parsedFirst = parseRepoIdentifier(first.full_name);
      if (parsedFirst) {
        setIsOpen(false);
        onSelectRepo(parsedFirst.owner, parsedFirst.repo);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-orbit-muted">
          {isLoading || isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin text-orbit-accent" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Repository search"
          className="w-full bg-orbit-surface border border-orbit-border rounded-xl pl-12 pr-28 py-3.5 text-sm sm:text-base text-orbit-text placeholder-orbit-faint font-mono focus:outline-none focus:border-orbit-accent focus:ring-1 focus:ring-orbit-accent shadow-lg shadow-black/40 transition-all"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-orbit-faint bg-orbit-subtle rounded border border-orbit-border">
            /
          </kbd>
          <button
            type="submit"
            disabled={!query.trim()}
            className="px-3 py-1.5 bg-orbit-accent hover:bg-orbit-accent-hover disabled:opacity-40 disabled:hover:bg-orbit-accent text-white rounded-lg text-xs font-medium font-sans flex items-center gap-1 transition-colors"
          >
            <span>Scan</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-orbit-surface border border-orbit-border rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-2 border-b border-orbit-border/50 text-[11px] uppercase tracking-wider font-mono text-orbit-faint px-3">
            Suggested Repositories
          </div>
          <ul className="divide-y divide-orbit-border/40 max-h-72 overflow-y-auto">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <li key={item.full_name}>
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseRepoIdentifier(item.full_name);
                      if (parsed) {
                        setIsOpen(false);
                        onSelectRepo(parsed.owner, parsed.repo);
                      }
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-orbit-accent/15 text-white' : 'hover:bg-orbit-subtle text-orbit-text'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="font-mono text-sm font-semibold truncate text-orbit-text">
                        {item.full_name}
                      </div>
                      {item.description && (
                        <div className="text-xs text-orbit-muted truncate mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-orbit-muted shrink-0">
                      {item.language && (
                        <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-orbit-card text-[11px] border border-orbit-border">
                          {item.language}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5" />
                        <span>{item.stargazers_count.toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
