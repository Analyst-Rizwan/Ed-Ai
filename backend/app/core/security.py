# app/core/security.py
from typing import Optional
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User

# Mock security functions to return a default user or bypass checks

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Mock verify password - always true"""
    return True

def get_password_hash(password: str) -> str:
    """Mock hash password - return plain"""
    return password

def hash_password(password: str) -> str:
    """Backward-compatible alias for get_password_hash"""
    return get_password_hash(password)

def create_access_token(data: dict, expires_delta: Optional[object] = None) -> str:
    """Mock create token - return dummy"""
    return "dummy_token"

def verify_token(token: str) -> Optional[dict]:
    """Mock verify token - always valid"""
    return {"sub": "guest@example.com"}

def get_current_user(
    db: Session = Depends(get_db),
    token: str = "dummy_token" # Optional, purely for compatibility if any other dep calls it
):
    """
    Dependency to get the current user.
    ALWAYS returns the first user in the DB (Guest/Admin) or creates a temporary one if DB is empty.
    """
    # Try to find a default user (e.g., ID 1 or a specific email)
    user = db.query(User).first()
    
    if not user:
        # If no user exists, create a dummy one for the session (volatile) 
        # or handle gracefully. ideally there should be a user seeded.
        # using a simple object might fail if dependencies expect a real SQLAlchemy model attached to session.
        # For now, let's assume seed data exists or we return None which might break things.
        # Better: create a transient user object
        user = User(
            id=1,
            email="guest@example.com",
            username="guest",
            is_active=True,
            is_superuser=False
        )
    
    return user
