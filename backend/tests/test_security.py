# tests/test_security.py
"""
Security-focused tests validating the fixes from the security enhancement plan.
Tests VULN-01 through VULN-18 remediations.
"""

from tests.conftest import _register_user, _login_user, _get_auth_headers


# ============================================================
# VULN-02: /api/ai/test endpoint should be REMOVED
# ============================================================
class TestAITestEndpointRemoved:
    def test_ai_test_endpoint_does_not_exist(self, client):
        """POST /api/ai/test should return 404/405 — endpoint was removed."""
        resp = client.post("/api/ai/test", json={"prompt": "hello"})
        assert resp.status_code in (404, 405), f"Endpoint still exists! Got {resp.status_code}"


# ============================================================
# VULN-04: Opportunities endpoints now require auth
# ============================================================
class TestOpportunitiesAuth:
    def test_jobs_requires_auth(self, client):
        resp = client.get("/api/opportunities/jobs")
        assert resp.status_code == 401

    def test_refresh_requires_auth(self, client):
        resp = client.get("/api/opportunities/refresh")
        assert resp.status_code == 401


# ============================================================
# VULN-12: Email enumeration prevented
# ============================================================
class TestEmailEnumeration:
    def test_register_duplicate_generic_message(self, client):
        """Register with same email should give generic error, not reveal that email exists."""
        _register_user(client, "enum_test@example.com", "enumuser1")
        resp = _register_user(client, "enum_test@example.com", "enumuser2")
        assert resp.status_code == 400
        detail = resp.json()["detail"]
        # Should NOT contain "already exists" or "email"
        assert "already exists" not in detail
        assert "Registration failed" in detail


# ============================================================
# VULN-14: /problems/categories now requires auth
# ============================================================
class TestCategoriesAuth:
    def test_categories_requires_auth(self, client):
        resp = client.get("/api/problems/categories")
        assert resp.status_code == 401


# ============================================================
# VULN-06: Roadmap input sanitization
# ============================================================
class TestRoadmapInputValidation:
    def test_topic_too_long_rejected(self, client, user_and_headers):
        _, headers = user_and_headers
        long_topic = "A" * 200
        resp = client.post(
            "/api/roadmaps/generate",
            json={"topic": long_topic},
            headers=headers,
        )
        assert resp.status_code == 422, "Topics over 100 chars should be rejected"


# ============================================================
# VULN-07: UserUpdate field validation
# ============================================================
class TestUserUpdateValidation:
    def test_invalid_url_rejected(self, client, user_and_headers):
        _, headers = user_and_headers
        resp = client.put(
            "/api/auth/me",
            json={"github_url": "javascript:alert(1)"},
            headers=headers,
        )
        assert resp.status_code == 422, "Non-http(s) URLs should be rejected"

    def test_valid_url_accepted(self, client, user_and_headers):
        _, headers = user_and_headers
        resp = client.put(
            "/api/auth/me",
            json={"github_url": "https://github.com/testuser"},
            headers=headers,
        )
        assert resp.status_code == 200

    def test_bio_too_long_rejected(self, client, user_and_headers):
        _, headers = user_and_headers
        resp = client.put(
            "/api/auth/me",
            json={"bio": "B" * 600},
            headers=headers,
        )
        assert resp.status_code == 422, "Bio over 500 chars should be rejected"


# ============================================================
# Encryption utility
# ============================================================
class TestEncryption:
    def test_encrypt_decrypt_roundtrip(self):
        from app.core.encryption import encrypt_value, decrypt_value
        original = "ghp_test_token_12345"
        secret = "test-secret-key"
        encrypted = encrypt_value(original, secret)
        assert encrypted != original, "Encrypted value should differ from original"
        decrypted = decrypt_value(encrypted, secret)
        assert decrypted == original, "Decrypted value should match original"

    def test_encrypt_empty_string(self):
        from app.core.encryption import encrypt_value, decrypt_value
        assert encrypt_value("", "key") == ""
        assert decrypt_value("", "key") == ""
        assert encrypt_value(None, "key") is None
        assert decrypt_value(None, "key") is None
