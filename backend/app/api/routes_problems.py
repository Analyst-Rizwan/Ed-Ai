# backend/app/api/routes_problems.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import random

from app.db.session import get_db
from app.models.problem import Problem
from app.models.progress import Progress
from app.schemas.problem import (
    Problem as ProblemSchema,
    ProblemDetail,
    ProblemCreate,
    ProblemUpdate,
    ProblemListResponse,
)

router = APIRouter(tags=["Problems"])  # ❗ NO PREFIX


# ============================================================
# GET PROBLEMS (PUBLIC with pagination & filtering)
# ============================================================
@router.get("", response_model=ProblemListResponse)
def get_problems(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),  # "all", "solved", "unsolved"
    db: Session = Depends(get_db),
):
    # TEMPORARY DEV USER
    user_id = 1
    
    # Base query
    query = db.query(Problem)

    # Search filter
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Problem.title.ilike(search_term),
                Problem.description.ilike(search_term)
            )
        )

    # Difficulty filter (case-insensitive - capitalize to match DB format)
    if difficulty and difficulty.lower() not in ["all", "none", ""]:
        difficulty_value = difficulty.capitalize()
        query = query.filter(Problem.difficulty == difficulty_value)

    # Category filter
    if category and category.lower() not in ["all", "none", ""]:
        query = query.filter(Problem.category == category)

    # Status filter (solved/unsolved)
    if status and status.lower() not in ["all", "none", ""]:
        if status.lower() == "solved":
            # Only problems that the user has solved
            solved_problem_ids = db.query(Progress.problem_id).filter(
                Progress.user_id == user_id,
                Progress.solved == True
            ).subquery()
            query = query.filter(Problem.id.in_(solved_problem_ids))
        elif status.lower() == "unsolved":
            # Problems that user hasn't solved
            solved_problem_ids = db.query(Progress.problem_id).filter(
                Progress.user_id == user_id,
                Progress.solved == True
            ).subquery()
            query = query.filter(~Problem.id.in_(solved_problem_ids))

    # Get total count after all filters
    total = query.count()

    # Pagination
    skip = (page - 1) * page_size
    problems = query.order_by(Problem.id).offset(skip).limit(page_size).all()

    # Build response with solved status
    problem_list = []
    for p in problems:
        progress = db.query(Progress).filter(
            Progress.user_id == user_id,
            Progress.problem_id == p.id
        ).first()
        
        solved = progress.solved if progress else False
        
        problem_list.append(
            ProblemSchema(
                id=p.id,
                title=p.title,
                description=p.description,
                difficulty=p.difficulty,
                category=p.category,
                acceptance=p.acceptance,
                likes=p.likes,
                tags=p.tags,
                starter_code=p.starter_code,
                test_cases=p.test_cases,
                hints=p.hints,
                solved=solved,
                leetcode_slug=p.leetcode_slug,
            )
        )

    return ProblemListResponse(
        problems=problem_list,
        total=total,
        page=page,
        page_size=page_size,
    )


# ============================================================
# GET CATEGORIES
# ============================================================
@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Problem.category).distinct().all()
    return [c[0] for c in categories if c[0]]


# ============================================================
# GET STATS (USER-BASED)
# ============================================================
@router.get("/stats")
def get_problem_stats(db: Session = Depends(get_db)):
    # TEMPORARY DEV USER
    user_id = 1
    
    total = db.query(Problem).count()
    
    # Get user's solved problems
    solved_progress = db.query(Progress).filter(
        Progress.user_id == user_id,
        Progress.solved == True
    ).all()
    
    total_solved = len(solved_progress)
    
    # Count by difficulty (case-insensitive)
    easy_solved = 0
    medium_solved = 0
    hard_solved = 0
    
    solved_problem_ids = [p.problem_id for p in solved_progress]
    if solved_problem_ids:
        solved_problems = db.query(Problem).filter(
            Problem.id.in_(solved_problem_ids)
        ).all()
        
        for problem in solved_problems:
            difficulty_lower = problem.difficulty.lower() if problem.difficulty else ""
            if difficulty_lower == "easy":
                easy_solved += 1
            elif difficulty_lower == "medium":
                medium_solved += 1
            elif difficulty_lower == "hard":
                hard_solved += 1
    
    # Get total count by difficulty (case-insensitive)
    easy_total = db.query(Problem).filter(
        func.lower(Problem.difficulty) == "easy"
    ).count()
    medium_total = db.query(Problem).filter(
        func.lower(Problem.difficulty) == "medium"
    ).count()
    hard_total = db.query(Problem).filter(
        func.lower(Problem.difficulty) == "hard"
    ).count()

    return {
        "total_problems": total,
        "total_solved": total_solved,
        "easy_solved": easy_solved,
        "easy_total": easy_total,
        "medium_solved": medium_solved,
        "medium_total": medium_total,
        "hard_solved": hard_solved,
        "hard_total": hard_total,
    }


# ============================================================
# RANDOM PROBLEM (WITH UNSOLVED FILTER)
# ============================================================
@router.get("/random")
def get_random_problem(
    difficulty: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    unsolved_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    # TEMPORARY DEV USER
    user_id = 1
    
    query = db.query(Problem)

    # Difficulty filter (case-insensitive - capitalize to match DB)
    if difficulty and difficulty != "all":
        difficulty_value = difficulty.capitalize()
        query = query.filter(Problem.difficulty == difficulty_value)
    
    if category and category != "all":
        query = query.filter(Problem.category == category)
    
    # Filter for unsolved problems only
    if unsolved_only:
        solved_problem_ids = db.query(Progress.problem_id).filter(
            Progress.user_id == user_id,
            Progress.solved == True
        ).subquery()
        query = query.filter(~Problem.id.in_(solved_problem_ids))

    problems = query.all()

    if not problems:
        raise HTTPException(status_code=404, detail="No problems found matching criteria")

    problem = random.choice(problems)
    
    # Check if solved
    progress = db.query(Progress).filter(
        Progress.user_id == user_id,
        Progress.problem_id == problem.id
    ).first()
    
    return {
        "id": problem.id,
        "title": problem.title,
        "difficulty": problem.difficulty,
        "category": problem.category,
        "solved": progress.solved if progress else False
    }


# ============================================================
# GET SINGLE PROBLEM
# ============================================================
@router.get("/{problem_id}", response_model=ProblemDetail)
def get_problem(
    problem_id: int,
    db: Session = Depends(get_db),
):
    # TEMPORARY DEV USER
    user_id = 1
    
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Check if user has solved it
    progress = db.query(Progress).filter(
        Progress.user_id == user_id,
        Progress.problem_id == problem_id
    ).first()
    
    solved = progress.solved if progress else False

    return ProblemDetail(
        id=problem.id,
        title=problem.title,
        description=problem.description,
        difficulty=problem.difficulty,
        category=problem.category,
        acceptance=problem.acceptance,
        likes=problem.likes,
        tags=problem.tags,
        starter_code=problem.starter_code,
        test_cases=problem.test_cases,
        hints=problem.hints,
        solved=solved,
        leetcode_slug=problem.leetcode_slug,
    )


# ============================================================
# CREATE PROBLEM (PUBLIC FOR NOW)
# ============================================================
@router.post("", response_model=ProblemSchema)
def create_problem(
    problem: ProblemCreate,
    db: Session = Depends(get_db),
):
    db_problem = Problem(**problem.dict())
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)

    return ProblemSchema(
        id=db_problem.id,
        title=db_problem.title,
        description=db_problem.description,
        difficulty=db_problem.difficulty,
        category=db_problem.category,
        acceptance=db_problem.acceptance,
        likes=db_problem.likes,
        tags=db_problem.tags,
        starter_code=db_problem.starter_code,
        test_cases=db_problem.test_cases,
        hints=db_problem.hints,
        solved=False,
        leetcode_slug=db_problem.leetcode_slug,
    )


# ============================================================
# UPDATE PROBLEM (PUBLIC FOR NOW)
# ============================================================
@router.put("/{problem_id}", response_model=ProblemSchema)
def update_problem(
    problem_id: int,
    problem_update: ProblemUpdate,
    db: Session = Depends(get_db),
):
    db_problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    for field, value in problem_update.dict(exclude_unset=True).items():
        setattr(db_problem, field, value)

    db.commit()
    db.refresh(db_problem)

    return ProblemSchema(
        id=db_problem.id,
        title=db_problem.title,
        description=db_problem.description,
        difficulty=db_problem.difficulty,
        category=db_problem.category,
        acceptance=db_problem.acceptance,
        likes=db_problem.likes,
        tags=db_problem.tags,
        starter_code=db_problem.starter_code,
        test_cases=db_problem.test_cases,
        hints=db_problem.hints,
        solved=False,
        leetcode_slug=db_problem.leetcode_slug,
    )


# ============================================================
# DELETE PROBLEM (PUBLIC FOR NOW)
# ============================================================
@router.delete("/{problem_id}")
def delete_problem(
    problem_id: int,
    db: Session = Depends(get_db),
):
    db_problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    db.delete(db_problem)
    db.commit()
    return {"message": "Problem deleted successfully"}