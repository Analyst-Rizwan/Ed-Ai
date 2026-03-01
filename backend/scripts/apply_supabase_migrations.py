import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment.")
    sys.exit(1)

# Ensure it uses postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to: {DATABASE_URL.split('@')[-1]}")

engine = create_engine(DATABASE_URL)

migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations')
sql_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])

with engine.connect() as conn:
    # Begin transaction
    with conn.begin():
        for file in sql_files:
            file_path = os.path.join(migrations_dir, file)
            print(f"Applying migration: {file}")
            with open(file_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
                conn.execute(text(sql_content))
                
print("All migrations applied successfully.")
