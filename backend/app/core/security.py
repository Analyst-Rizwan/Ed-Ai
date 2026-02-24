# app/core/security.py
# 
# Re-exports from the real auth module for backward compatibility.
# All actual logic lives in app.auth.utils, app.auth.service, and app.auth.dependencies.

from app.auth.utils import verify_password, get_password_hash
from app.auth.service import create_access_token, create_refresh_token
from app.auth.dependencies import get_current_user, get_current_active_user, get_current_active_superuser, require_role

# Backward-compatible alias
hash_password = get_password_hash


def verify_token(token: str):
    """
    Decode and return the JWT payload. Returns None on failure.
    This is kept for backward compat with routes_auth.py (legacy).
    """
    from jose import jwt, JWTError
    from app.core.config import settings

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
