"""Tests for TTLCache functionality."""

import time

from app.services.cache import TTLCache


def test_cache_set_and_get():
    """Verify storing and retrieving values."""
    c = TTLCache(default_ttl_seconds=10)
    c.set("test_key", {"data": 123})
    assert c.get("test_key") == {"data": 123}
    assert c.size() == 1


def test_cache_expiration():
    """Verify expired entries return None."""
    c = TTLCache(default_ttl_seconds=1)
    c.set("expiring_key", "value", ttl_seconds=0)  # Expires immediately
    time.sleep(0.01)
    assert c.get("expiring_key") is None


def test_cache_delete_and_clear():
    """Verify deletion and clearing."""
    c = TTLCache()
    c.set("key1", "val1")
    c.set("key2", "val2")

    assert c.delete("key1") is True
    assert c.get("key1") is None
    assert c.get("key2") == "val2"

    c.clear()
    assert c.size() == 0
    assert c.get("key2") is None


def test_cache_max_entries_bound():
    """Verify cache bounds enforcement when exceeding max entries."""
    c = TTLCache(default_ttl_seconds=60, max_entries=3)
    c.set("k1", 1)
    c.set("k2", 2)
    c.set("k3", 3)
    c.set("k4", 4)  # Exceeds max entries

    assert c.size() <= 3
    assert c.get("k4") == 4
