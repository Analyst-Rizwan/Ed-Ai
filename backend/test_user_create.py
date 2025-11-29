#!/usr/bin/env python
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password, create_access_token

db = SessionLocal()
try:
    # Create test user
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=hash_password("test123")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"✓ User created: {user.username} ({user.email})")
    
    # Generate token
    token = create_access_token({"sub": user.email})
    print(f"✓ Token generated: {token[:50]}...")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
