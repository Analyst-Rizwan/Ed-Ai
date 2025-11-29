import sqlite3

db_path = r"D:\Ed-!\backend\eduai.db"
sql_file = r"D:\Ed-!\backend\app\db\migrations\0001_create_tutor_tables.sql"

print("Running migration:", sql_file)

with open(sql_file, "r", encoding="utf-8") as f:
    sql = f.read()

con = sqlite3.connect(db_path)
cur = con.cursor()
cur.executescript(sql)
con.commit()

print("✅ Migration applied successfully.")

cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in cur.fetchall()]
print("Tables in DB:", tables)

con.close()
