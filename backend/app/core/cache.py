# backend/app/core/cache.py
"""
Simple in-memory TTL cache for read-heavy endpoints.
No Redis dependency — works per-worker with Gunicorn.
"""

import time
from functools import wraps
from typing import Any, Callable


_cache: dict[str, tuple[float, Any]] = {}


def ttl_cache(seconds: int = 300):
    """
    Decorator that caches function return values for `seconds`.

    Usage:
        @ttl_cache(seconds=600)
        def get_categories(db):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = f"{func.__module__}.{func.__qualname__}"
            now = time.time()

            cached = _cache.get(key)
            if cached and (now - cached[0]) < seconds:
                return cached[1]

            result = func(*args, **kwargs)
            _cache[key] = (now, result)
            return result

        wrapper.cache_clear = lambda: _cache.pop(
            f"{func.__module__}.{func.__qualname__}", None
        )
        return wrapper
    return decorator
