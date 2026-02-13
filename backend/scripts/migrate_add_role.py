import sqlite3
import os

# Adjust path if needed, assuming running from backend dir
DB_PATH = "eduai.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "role" not in columns:
            print("Adding 'role' column to 'users' table...")
            cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user'")
            conn.commit()
            print("✅ 'role' column added successfully.")
        else:
            print("ℹ️ 'role' column already exists.")

    except Exception as e:
        print(f"❌ Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
