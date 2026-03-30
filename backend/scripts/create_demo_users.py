"""
Create 13 demo user accounts: demo1@gmail.com / demo1 ... demo13@gmail.com / demo13
Run from the backend/ directory:
    python -m scripts.create_demo_users
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.user import User
from app.auth.utils import get_password_hash
from app.db.base import Base  # ensure all models are loaded

DEMO_USERS = [
    {"email": f"demo{i}@gmail.com", "username": f"demo{i}", "password": f"demo{i}"}
    for i in range(1, 14)
]

db = SessionLocal()
created = []
skipped = []

for u in DEMO_USERS:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if existing:
        skipped.append(u["email"])
        continue

    user = User(
        email=u["email"],
        username=u["username"],
        full_name=u["username"].capitalize(),
        password_hash=get_password_hash(u["password"]),
        is_active=True,
        role="user",
    )
    db.add(user)
    created.append(u["email"])

db.commit()
db.close()

print(f"\n✅ Created ({len(created)}): {created}")
print(f"⏭️  Skipped already-existing ({len(skipped)}): {skipped}")
