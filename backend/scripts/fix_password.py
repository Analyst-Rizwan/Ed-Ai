from app.db.session import SessionLocal
from app.models.user import User
from app.auth.utils import get_password_hash
from app.db.base import Base # ensure models load

print("Connecting to DB...")
db = SessionLocal()

print("Fetching user...")
user = db.query(User).filter(User.email.ilike('%rizwan%')).first()

if user:
    print(f"Found user: {user.email}")
    user.password_hash = get_password_hash('yourpassword')
    db.commit()
    print("Password hash fixed successfully!")
else:
    print("User not found.")
