# tests/test_problems.py
"""
Tests for problem endpoints:
  GET /api/problems
  GET /api/problems/stats
  GET /api/problems/categories
"""

from tests.conftest import _register_user, _get_auth_headers
from app.models.problem import Problem


# ============================================================
# HELPERS
# ============================================================

def _seed_problems(db, count=3):
    """Seed test problems into the database."""
    problems = []
    for i in range(1, count + 1):
        p = Problem(
            title=f"Problem {i}",
            description=f"Description for problem {i}",
            difficulty=["easy", "medium", "hard"][(i - 1) % 3],
            category=["arrays", "strings", "trees"][(i - 1) % 3],
        )
        db.add(p)
        problems.append(p)
    db.commit()
    for p in problems:
        db.refresh(p)
    return problems


# ============================================================
# LIST PROBLEMS
# ============================================================

class TestListProblems:
    def test_list_problems_authenticated(self, client, user_and_headers, db):
        _, headers = user_and_headers
        _seed_problems(db)
        resp = client.get("/api/problems", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "problems" in data
        assert len(data["problems"]) == 3

    def test_list_problems_unauthenticated(self, client):
        resp = client.get("/api/problems")
        assert resp.status_code == 401

    def test_list_problems_pagination(self, client, user_and_headers, db):
        _, headers = user_and_headers
        _seed_problems(db, count=5)
        resp = client.get("/api/problems?page=1&page_size=2", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["problems"]) == 2
        assert data["total"] == 5


# ============================================================
# PROBLEM STATS
# ============================================================

class TestProblemStats:
    def test_get_stats(self, client, user_and_headers, db):
        _, headers = user_and_headers
        _seed_problems(db)
        resp = client.get("/api/problems/stats", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_problems" in data
        assert data["total_problems"] == 3
        assert "easy_total" in data
        assert "medium_total" in data


# ============================================================
# CATEGORIES
# ============================================================

class TestCategories:
    def test_get_categories(self, client, user_and_headers, db):
        _, headers = user_and_headers
        _seed_problems(db)
        resp = client.get("/api/problems/categories", headers=headers)
        assert resp.status_code == 200
