import os
import sys

# Add backend directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.db.session import SessionLocal

def add_column_if_not_exists(session, table, column, type_def):
    try:
        session.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
        print(f"Column {column} already exists in {table}.")
    except Exception:
        session.rollback()
        print(f"Adding column {column} to {table}...")
        try:
             session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}"))
             session.commit()
             print(f"Added column {column}.")
        except Exception as e:
             print(f"Failed to add column {column}: {e}")
             session.rollback()

def migrate():
    db = SessionLocal()
    try:
        print("Starting migration for password_hash...")
        add_column_if_not_exists(db, "users", "password_hash", "VARCHAR")
        print("Migration complete.")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
