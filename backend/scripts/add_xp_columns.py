
from sqlalchemy import text
from app.db.session import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        # Add columns to users table
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1"))
        
        # Add column to roadmaps table
        db.execute(text("ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 100"))
        
        db.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
