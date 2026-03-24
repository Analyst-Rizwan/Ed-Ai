import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).order_by(User.id).all()
print(f"{'ID':<6} {'Email':<35} {'Username':<20} {'Name':<25} {'Role':<8} Active")
print("-" * 100)
for u in users:
    print(f"{u.id:<6} {u.email:<35} {u.username:<20} {str(u.full_name or ''):<25} {str(u.role or ''):<8} {u.is_active}")
print(f"\nTotal: {len(users)} users")
db.close()
