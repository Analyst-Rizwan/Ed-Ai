"""Verify the fix worked - test the exact query that was failing."""
import os
os.environ["DATABASE_URL"] = "postgresql://postgres.hcidjkbsrkygdimdfura:HgqV62$cH++z?wG@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

from app.db.session import engine, Base
from app.models.problem import Problem
from app.models.progress import Progress
from sqlalchemy.orm import Session
from sqlalchemy import func

lines = []
try:
    session = Session(bind=engine)
    
    total = session.query(Problem).count()
    lines.append(f"[OK] Problem.count() = {total}")
    
    problems = session.query(Problem).order_by(Problem.id).offset(0).limit(10).all()
    lines.append(f"[OK] Got {len(problems)} problems")
    
    easy_total = session.query(Problem).filter(func.lower(Problem.difficulty) == "easy").count()
    lines.append(f"[OK] Easy problems = {easy_total}")
    
    # THIS WAS THE FAILING QUERY
    solved_progress = session.query(Progress).filter(
        Progress.user_id == 1,
        Progress.solved == True
    ).all()
    lines.append(f"[OK] Progress query = {len(solved_progress)} records (THIS WAS THE BUG!)")
    
    lines.append("")
    lines.append("ALL QUERIES PASSED - Production should work now!")
    session.close()
except Exception as e:
    lines.append(f"[FAIL] {type(e).__name__}: {e}")

with open("check_result.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
