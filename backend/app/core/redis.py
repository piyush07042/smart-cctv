# Redis helper
import redis as _redis
from app.core.config import settings

_client: _redis.Redis | None = None


def get_redis() -> _redis.Redis:
    """Return a cached Redis connection."""
    global _client
    if _client is None:
        _client = _redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client
