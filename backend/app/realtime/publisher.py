import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.redis import get_redis

logger = logging.getLogger(__name__)

def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def publish_realtime(channel: str, msg_type: str, payload: dict) -> None:
    """
    Publish a realtime message to a Redis channel using the standard envelope.
    """
    try:
        r = get_redis()
        if not r:
            logger.warning("Redis client not available, skipping publish.")
            return

        envelope = {
            "type": msg_type,
            "version": 1,
            "timestamp": _utcnow_iso(),
            "payload": payload
        }
        
        # We use a try-except to ensure publish failures don't crash the caller
        r.publish(channel, json.dumps(envelope))
        logger.debug(f"Published to {channel}: {msg_type}")
    except Exception as e:
        logger.warning(f"Failed to publish to {channel}: {e}")
