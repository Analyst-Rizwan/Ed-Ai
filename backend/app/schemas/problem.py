from typing import List, Optional
from pydantic import BaseModel, ConfigDict


# ============================================================
# BASE SCHEMA
# ============================================================
class ProblemBase(BaseModel):
    title: str
    description: str
    difficulty: str
    category: Optional[str] = None
    acceptance: Optional[float] = 0.0
    likes: Optional[int] = 0
    tags: List[str] = []
    hints: List[str] = []


# ============================================================
# CREATE / UPDATE
# ============================================================
class ProblemCreate(ProblemBase):
    pass


class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    acceptance: Optional[float] = None
    likes: Optional[int] = None
    tags: Optional[List[str]] = None
    hints: Optional[List[str]] = None


# ============================================================
# RESPONSE SCHEMAS
# ============================================================
class Problem(ProblemBase):
    id: int
    solved: bool = False

    model_config = ConfigDict(from_attributes=True)


class ProblemDetail(Problem):
    starter_code: Optional[str] = None
    test_cases: List[dict] = []


# ============================================================
# LIST RESPONSE
# ============================================================
class ProblemListResponse(BaseModel):
    problems: List[Problem]
    total: int
    page: int
    page_size: int
