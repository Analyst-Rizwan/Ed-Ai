# tests/test_progress.py
"""
Tests for progress endpoints:
  POST /api/progress/problem/{id}/complete
  GET  /api/progress/user/me
  GET  /api/progress/admin-stats
"""

from tests.conftest import _register_user, _get_auth_headers
from app.models.problem import Problem


def _seed_problem(db):
    """Create a single test problem and return it."""
    p = Problem(
        title="Test Problem",
        description="Test description",
        difficulty="easy",
        category="arrays",
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ============================================================
# COMPLETE PROBLEM → XP AWARDED
# ============================================================

class TestCompleteProblem:
    def test_complete_problem_awards_xp(self, client, user_and_headers, db):
        user_data, headers = user_and_headers
        problem = _seed_problem(db)

        resp = client.post(f"/api/progress/problem/{problem.id}/complete", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["xp_gained"] == 20
        assert data["message"] == "Problem marked completed"

    def test_complete_nonexistent_problem(self, client, user_and_headers):
        _, headers = user_and_headers
        resp = client.post("/api/progress/problem/99999/complete", headers=headers)
        assert resp.status_code == 404


# ============================================================
# GET MY PROGRESS
# ============================================================

class TestMyProgress:
    def test_get_my_progress(self, client, user_and_headers):
        _, headers = user_and_headers
        resp = client.get("/api/progress/user/me", headers=headers)
        assert resp.status_code == 200

    def test_get_my_progress_unauthenticated(self, client):
        resp = client.get("/api/progress/user/me")
        assert resp.status_code == 401


# ============================================================
# ADMIN STATS
# ============================================================

class TestAdminStats:
    def test_admin_stats_as_admin(self, client, admin_and_headers):
        _, headers = admin_and_headers
        resp = client.get("/api/progress/admin-stats", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "totalUsers" in data
        assert "totalProblems" in data

    def test_admin_stats_as_regular_user(self, client, user_and_headers):
        _, headers = user_and_headers
        resp = client.get("/api/progress/admin-stats", headers=headers)
        assert resp.status_code == 403
