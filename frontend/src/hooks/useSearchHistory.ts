import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'orbit_search_history_v1';
const MAX_HISTORY = 10;

export interface HistoryItem {
  identifier: string; // e.g., 'facebook/react'
  timestamp: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback if parsing fails or localStorage is blocked
    }
    return [
      { identifier: 'tiangolo/fastapi', timestamp: Date.now() - 3600000 * 2 },
      { identifier: 'facebook/react', timestamp: Date.now() - 3600000 * 4 },
      { identifier: 'torvalds/linux', timestamp: Date.now() - 3600000 * 24 },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Silently ignore storage quota errors
    }
  }, [history]);

  const addHistoryItem = useCallback((identifier: string) => {
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed) return;

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.identifier.toLowerCase() !== trimmed);
      return [{ identifier: trimmed, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  const removeHistoryItem = useCallback((identifier: string) => {
    setHistory((prev) => prev.filter((item) => item.identifier.toLowerCase() !== identifier.toLowerCase()));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
  };
}
