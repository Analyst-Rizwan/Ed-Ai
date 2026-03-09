import sqlite3
import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python get_latest_otp.py <email>")
        return
    email = sys.argv[1]
    conn = sqlite3.connect('d:\\Ed-!\\backend\\eduai.db')
    c = conn.cursor()
    c.execute("SELECT code FROM otp_codes WHERE email=? ORDER BY created_at DESC LIMIT 1", (email,))
    row = c.fetchone()
    if row:
        print(row[0])
    else:
        print("NOT_FOUND")
    conn.close()

if __name__ == "__main__":
    main()
