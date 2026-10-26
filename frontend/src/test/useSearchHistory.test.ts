import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchHistory } from '../hooks/useSearchHistory';

describe('useSearchHistory Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds items and deduplicates them', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addHistoryItem('golang/go');
    });

    expect(result.current.history[0].identifier).toBe('golang/go');

    // Add again to verify it moves to top and doesn't duplicate
    act(() => {
      result.current.addHistoryItem('rust-lang/rust');
      result.current.addHistoryItem('golang/go');
    });

    expect(result.current.history[0].identifier).toBe('golang/go');
    expect(result.current.history[1].identifier).toBe('rust-lang/rust');
  });

  it('removes and clears history items', () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addHistoryItem('pallets/flask');
      result.current.removeHistoryItem('pallets/flask');
    });

    expect(result.current.history.some((h) => h.identifier === 'pallets/flask')).toBe(false);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
  });
});
