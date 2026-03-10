# tests/test_auth.py
"""
Tests for authentication endpoints:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me
  POST /api/auth/logout
"""

from tests.conftest import _register_user, _login_user, _get_auth_headers


# ============================================================
# REGISTER
# ============================================================

class TestRegister:
    def test_register_success(self, client):
        resp = _register_user(client, "new@example.com", "newuser")
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert data["username"] == "newuser"
        assert "id" in data

    def test_register_duplicate_email(self, client):
        _register_user(client, "dup@example.com", "user1")
        resp = _register_user(client, "dup@example.com", "user2")
        assert resp.status_code == 400
        # SECURITY: Generic message to prevent email enumeration (VULN-12)
        assert "Registration failed" in resp.json()["detail"]

    def test_register_missing_fields(self, client):
        resp = client.post("/api/auth/register", json={"email": "x@x.com"})
        assert resp.status_code == 422  # Validation error


# ============================================================
# LOGIN
# ============================================================

class TestLogin:
    def test_login_success(self, client):
        _register_user(client, "login@example.com", "loginuser")
        resp = _login_user(client, "login@example.com")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        _register_user(client, "wrong@example.com", "wronguser")
        resp = _login_user(client, "wrong@example.com", "BadPassword!")
        assert resp.status_code == 400
        assert "Incorrect" in resp.json()["detail"]

    def test_login_nonexistent_user(self, client):
        resp = _login_user(client, "ghost@example.com")
        assert resp.status_code == 400


# ============================================================
# GET /auth/me
# ============================================================

class TestMe:
    def test_get_me_authenticated(self, client, user_and_headers):
        _, headers = user_and_headers
        resp = client.get("/api/auth/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "test@example.com"
        assert data["username"] == "testuser"

    def test_get_me_no_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_get_me_invalid_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401


# ============================================================
# LOGOUT
# ============================================================

class TestLogout:
    def test_logout(self, client, user_and_headers):
        _, headers = user_and_headers
        resp = client.post("/api/auth/logout", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["message"] == "Logged out successfully"
