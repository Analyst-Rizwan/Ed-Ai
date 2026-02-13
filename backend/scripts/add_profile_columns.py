import os
import sys

# Add backend directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.db.session import SessionLocal

def add_column_if_not_exists(session, table, column, type_def):
    try:
        # Check if column exists (PostgreSQL specific, but adaptable)
        # Using a simple method: try to select from it, if fails, add it.
        # Ideally query information_schema, but this is a quick fix script.
        session.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
        print(f"Column {column} already exists in {table}.")
    except Exception:
        session.rollback()
        print(f"Adding column {column} to {table}...")
        session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}"))
        session.commit()
        print(f"Added column {column}.")

def migrate():
    db = SessionLocal()
    try:
        print("Starting migration...")
        columns = [
            ("bio", "VARCHAR"),
            ("avatar_url", "VARCHAR"),
            ("github_url", "VARCHAR"),
            ("linkedin_url", "VARCHAR"),
            ("website_url", "VARCHAR"),
            ("location", "VARCHAR")
        ]
        
        for col_name, col_type in columns:
            add_column_if_not_exists(db, "users", col_name, col_type)
            
        print("Migration complete.")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
