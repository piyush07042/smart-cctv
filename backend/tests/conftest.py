"""
conftest.py — shared fixtures for Phase 2 tests.

Uses SQLite in-memory with StaticPool so all connections share
the same in-memory database (no PostgreSQL or Docker needed).
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# --- Patch settings BEFORE any other app import reads DATABASE_URL ---
from app.core import config as cfg
cfg.settings.DATABASE_URL = "sqlite://"

class MockPipeline:
    def __init__(self, parent):
        self.parent = parent
        self.commands = []
    def zremrangebyscore(self, name, min, max):
        self.commands.append("zremrangebyscore")
        return self
    def zadd(self, name, mapping):
        self.commands.append("zadd")
        return self
    def zcard(self, name):
        self.commands.append(("zcard", name))
        return self
    def expire(self, name, time):
        self.commands.append("expire")
        return self
    def execute(self):
        res = []
        for cmd in self.commands:
            if isinstance(cmd, tuple) and cmd[0] == "zcard":
                name = cmd[1]
                # Keep track of hits per key
                self.parent.zcard_hits[name] = self.parent.zcard_hits.get(name, 0) + 1
                res.append(self.parent.zcard_hits[name])
            else:
                res.append(None)
        return res

class MockRedis:
    def __init__(self):
        self.store = {}
        self.zcard_hits = {}
        
    def get(self, key):
        if not isinstance(key, str):
            return None
        return self.store.get(key)
        
    def setex(self, name, time, value):
        self.store[name] = value
        
    def pipeline(self):
        return MockPipeline(self)
        
    def publish(self, channel, message):
        return 1
    
    def reset_rate_limits(self):
        self.zcard_hits = {}

_mock_redis_instance = MockRedis()

import redis
redis.from_url = lambda *args, **kwargs: _mock_redis_instance

@pytest.fixture(autouse=True)
def reset_redis():
    _mock_redis_instance.reset_rate_limits()
    _mock_redis_instance.store = {}
    yield


# Safe to import app now
from app.main import app as fastapi_app  # noqa: E402
from app.core.database import get_db  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.models.base import Base  # noqa: E402

# Import all models so they register with Base before create_all
import app.models.users  # noqa: F401
import app.models.cameras  # noqa: F401
import app.models.events  # noqa: F401
import app.models.alerts  # noqa: F401

# StaticPool: every call to engine.connect() reuses the SAME underlying
# connection, so the in-memory SQLite database persists across sessions.
_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def override_get_db():
    db = _TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


fastapi_app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables and seed demo users once per test session."""
    Base.metadata.create_all(bind=_engine)

    db = _TestingSessionLocal()
    User = app.models.users.User
    if not db.query(User).filter(User.username == "testadmin").first():
        db.add(User(
            username="testadmin",
            email="testadmin@example.com",
            password_hash=get_password_hash("testpass"),
            role="ADMIN",
        ))
    if not db.query(User).filter(User.username == "testoperator").first():
        db.add(User(
            username="testoperator",
            email="testoperator@example.com",
            password_hash=get_password_hash("operpass"),
            role="OPERATOR",
        ))
    if not db.query(User).filter(User.username == "testviewer").first():
        db.add(User(
            username="testviewer",
            email="testviewer@example.com",
            password_hash=get_password_hash("viewpass"),
            role="VIEWER",
        ))
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=_engine)


@pytest.fixture(scope="session")
def client(setup_database):
    with TestClient(fastapi_app) as c:
        yield c
