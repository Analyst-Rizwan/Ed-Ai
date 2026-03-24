"""
Quick admin script — set passwords for specific users directly in the DB.
Run from the backend directory with the venv activated:

    python scripts/set_password.py

Edit USERS_TO_UPDATE below with (email, new_password) pairs before running.
"""

import sys
import os

# Ensure backend package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.user import User
from app.auth.utils import get_password_hash

# ── EDIT THIS LIST ──────────────────────────────────────────
USERS_TO_UPDATE = [
    ("mohamedrizwanansaari@gmail.com", "Rizwan7205@"),
    ("rizwanansaari7205@gmail.com", "Rizwan7205@"),
]
# ────────────────────────────────────────────────────────────

def main():
    if not USERS_TO_UPDATE:
        print("⚠  No users defined. Edit USERS_TO_UPDATE in this script and re-run.")
        return

    db = SessionLocal()
    try:
        for email, new_password in USERS_TO_UPDATE:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                print(f"❌  Not found: {email}")
                continue
            user.password_hash = get_password_hash(new_password)
            db.add(user)
            print(f"✅  Updated: {email}")

        db.commit()
        print("\nDone — all changes committed.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
