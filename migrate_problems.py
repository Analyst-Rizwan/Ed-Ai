import sqlite3
import psycopg2
import json

def migrate():
    sqlite_conn = sqlite3.connect("/app/eduai.db")
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()
    
    sqlite_cur.execute("SELECT * FROM problems")
    problems = sqlite_cur.fetchall()
    print(f"Read {len(problems)} problems from SQLite.")
    
    pg_conn = psycopg2.connect("postgresql://eduai:eduai_secret@db:5432/eduai")
    pg_cur = pg_conn.cursor()
    
    # Delete existing problems to prevent unique constraint conflicts (especially from the 20 seeded ones)
    pg_cur.execute("TRUNCATE TABLE problems CASCADE;")
    
    inserted = 0
    errors = 0
    
    for p in problems:
        pid = p['id'] if 'id' in p.keys() else None
        title = p['title'] if 'title' in p.keys() else ''
        desc = p['description'] if 'description' in p.keys() else ''
        diff = p['difficulty'] if 'difficulty' in p.keys() else 'medium'
        cat = p['category'] if 'category' in p.keys() else ''
        slug = p['leetcode_slug'] if 'leetcode_slug' in p.keys() else ''
        likes = p['likes'] if 'likes' in p.keys() else 0
        acc = p['acceptance'] if 'acceptance' in p.keys() else 0.0
        
        tags_val = p['tags'] if 'tags' in p.keys() else None
        if isinstance(tags_val, str):
            try:
                tags_json = json.dumps(json.loads(tags_val))
            except:
                tags_json = '[]'
        else:
            tags_json = '[]'
            
        tc_val = p['test_cases'] if 'test_cases' in p.keys() else None
        if isinstance(tc_val, str):
            try:
                tc_json = json.dumps(json.loads(tc_val))
            except:
                tc_json = '[]'
        else:
            tc_json = '[]'
            
        starter = p['starter_code'] if 'starter_code' in p.keys() else None
            
        try:
            pg_cur.execute("SAVEPOINT batch;")
            pg_cur.execute(
                """
                INSERT INTO problems (id, title, description, difficulty, category, leetcode_slug, likes, acceptance, tags, starter_code, test_cases)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    difficulty = EXCLUDED.difficulty,
                    category = EXCLUDED.category,
                    leetcode_slug = EXCLUDED.leetcode_slug,
                    likes = EXCLUDED.likes,
                    acceptance = EXCLUDED.acceptance,
                    tags = EXCLUDED.tags,
                    starter_code = EXCLUDED.starter_code,
                    test_cases = EXCLUDED.test_cases
                """,
                (pid, title, desc, diff, cat, slug, likes, acc, tags_json, starter, tc_json)
            )
            pg_cur.execute("RELEASE SAVEPOINT batch;")
            inserted += 1
        except Exception as e:
            pg_cur.execute("ROLLBACK TO SAVEPOINT batch;")
            print(f"Error on problem {pid}: {e}")
            errors += 1
            
    pg_conn.commit()
    
    # Sync the ID sequence so next inserts don't fail
    pg_cur.execute("SELECT setval(pg_get_serial_sequence('problems', 'id'), coalesce(max(id),0) + 1, false) FROM problems;")
    pg_conn.commit()
    
    print(f"Migrated problems to Postgres. Success: {inserted}, Errors: {errors}")

if __name__ == "__main__":
    migrate()
