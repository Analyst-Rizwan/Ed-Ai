# tests/conftest.py
"""
Shared test fixtures for the Ed-AI backend test suite.

- Uses an in-memory SQLite database (fast, isolated per-test-session).
- Overrides FastAPI's `get_db` dependency so all routes use the test DB.
- Provides helper fixtures for creating users and getting auth headers.
"""

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db.base_class import Base
from app.main import app

# Import get_db from the canonical source
from app.db.session import get_db

# ============================================================
# TEST DATABASE (In-memory SQLite)
# ============================================================
SQLALCHEMY_TEST_URL = "sqlite://"  # in-memory

test_engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
)

# Enable WAL-like behavior for SQLite foreign keys
@event.listens_for(test_engine, "connect")
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


# ============================================================
# FIXTURES
# ============================================================

@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all tables once for the test session."""
    # Import all models so Base.metadata knows about them
    import app.models  # noqa: F401
    from app.db.models_tutor import Conversation, TutorMessage  # noqa: F401
    from app.db.models_tutor import Roadmap as TutorRoadmap  # noqa: F401

    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db():
    """Provide a transactional database session that rolls back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """FastAPI TestClient with the test database injected."""
    from app.core.rate_limit import limiter

    def _override_get_db():
        try:
            yield db
        finally:
            pass

    # Single override — session.py is the canonical source
    app.dependency_overrides[get_db] = _override_get_db

    # Disable rate limiting during tests
    limiter.enabled = False

    with TestClient(app) as c:
        yield c

    limiter.enabled = True
    app.dependency_overrides.clear()


# ============================================================
# AUTH HELPERS
# ============================================================

def _register_user(client: TestClient, email: str, username: str, password: str = "Test1234!"):
    """Register a user via the API and return the response."""
    return client.post("/api/auth/register", json={
        "email": email,
        "username": username,
        "full_name": "Test User",
        "password": password,
    })


def _login_user(client: TestClient, email: str, password: str = "Test1234!"):
    """Login via the API and return the response (contains access_token)."""
    return client.post("/api/auth/login", data={
        "username": email,  # OAuth2 form uses 'username' field for email
        "password": password,
    })


def _get_auth_headers(client: TestClient, email: str, password: str = "Test1234!") -> dict:
    """Login and return Authorization headers."""
    resp = _login_user(client, email, password)
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def user_and_headers(client, db):
    """Create a regular user and return (user_data, auth_headers)."""
    reg = _register_user(client, "test@example.com", "testuser")
    assert reg.status_code == 201
    headers = _get_auth_headers(client, "test@example.com")
    return reg.json(), headers


@pytest.fixture()
def admin_and_headers(client, db):
    """Create an admin user and return (user_data, auth_headers)."""
    from app.models.user import User

    reg = _register_user(client, "admin@example.com", "adminuser", "Admin1234!")
    assert reg.status_code == 201

    # Promote to superuser directly in DB
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    admin.is_superuser = True
    admin.role = "admin"
    db.commit()

    headers = _get_auth_headers(client, "admin@example.com", "Admin1234!")
    return reg.json(), headers
