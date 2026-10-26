"""Thread-safe bounded in-memory TTL cache."""

import threading
import time
from typing import Any


class TTLCache:
    """Thread-safe in-memory cache with expiration and maximum size bounds."""

    def __init__(self, default_ttl_seconds: int = 300, max_entries: int = 500) -> None:
        self.default_ttl = default_ttl_seconds
        self.max_entries = max_entries
        self._cache: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        """Retrieve value if exists and not expired, else None."""
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None

            expires_at, value = entry
            if time.time() > expires_at:
                del self._cache[key]
                return None

            return value

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        """Store a value with an expiration timestamp."""
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expires_at = time.time() + ttl

        with self._lock:
            # If cache exceeds max bounds, prune expired entries
            if len(self._cache) >= self.max_entries and key not in self._cache:
                self._prune_expired()

            # If still exceeds bounds after pruning, drop oldest entry
            if len(self._cache) >= self.max_entries and key not in self._cache:
                oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][0])
                del self._cache[oldest_key]

            self._cache[key] = (expires_at, value)

    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()

    def size(self) -> int:
        """Return number of valid (non-expired) entries."""
        with self._lock:
            self._prune_expired()
            return len(self._cache)

    def _prune_expired(self) -> None:
        """Internal helper to prune expired keys (must be called with lock held)."""
        now = time.time()
        expired_keys = [k for k, (expires_at, _) in self._cache.items() if now > expires_at]
        for k in expired_keys:
            del self._cache[k]


# Singleton application cache instance
cache = TTLCache(default_ttl_seconds=300, max_entries=1000)
