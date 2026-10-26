import { useState, useCallback } from 'react';

const MAX_COMPARE = 3;

export function useComparison() {
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

  const toggleRepo = useCallback((repoIdentifier: string) => {
    const normalized = repoIdentifier.trim().toLowerCase();
    setSelectedRepos((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((r) => r !== normalized);
      }
      if (prev.length >= MAX_COMPARE) {
        return prev;
      }
      return [...prev, normalized];
    });
  }, []);

  const addRepo = useCallback((repoIdentifier: string) => {
    const normalized = repoIdentifier.trim().toLowerCase();
    setSelectedRepos((prev) => {
      if (prev.includes(normalized) || prev.length >= MAX_COMPARE) {
        return prev;
      }
      return [...prev, normalized];
    });
  }, []);

  const removeRepo = useCallback((repoIdentifier: string) => {
    const normalized = repoIdentifier.trim().toLowerCase();
    setSelectedRepos((prev) => prev.filter((r) => r !== normalized));
  }, []);

  const clearCompare = useCallback(() => {
    setSelectedRepos([]);
  }, []);

  const isSelected = useCallback(
    (repoIdentifier: string) => {
      return selectedRepos.includes(repoIdentifier.trim().toLowerCase());
    },
    [selectedRepos]
  );

  return {
    selectedRepos,
    toggleRepo,
    addRepo,
    removeRepo,
    clearCompare,
    isSelected,
    maxAllowed: MAX_COMPARE,
  };
}
