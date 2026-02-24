# backend/app/core/rate_limit.py
"""
Rate limiting configuration using slowapi.

Limits:
  - /auth/login   → 5 requests/minute per IP
  - /auth/register → 3 requests/minute per IP
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
