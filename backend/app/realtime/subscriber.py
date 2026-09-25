import asyncio
import json
import logging
from app.core.redis import get_redis
from app.realtime.websocket import manager

logger = logging.getLogger(__name__)

CHANNELS = ["events.new", "alerts.new", "alerts.updated", "camera.health"]

_pubsub_thread = None

def _message_handler(message, loop):
    if message["type"] == "message":
        channel = message["channel"]
        data = message["data"]
        try:
            parsed_msg = json.loads(data)
            asyncio.run_coroutine_threadsafe(
                manager.broadcast_message(channel, parsed_msg), loop
            )
        except json.JSONDecodeError:
            pass
        except Exception as e:
            logger.error(f"Error handling message: {e}")

async def start_redis_subscriber():
    global _pubsub_thread
    loop = asyncio.get_running_loop()
    
    try:
        r = get_redis()
        if not r:
            logger.warning("Redis client not available for subscriber")
            return

        pubsub = r.pubsub()
        
        handlers = {ch: lambda m, l=loop: _message_handler(m, l) for ch in CHANNELS}
        pubsub.subscribe(**handlers)
        
        _pubsub_thread = pubsub.run_in_thread(sleep_time=0.1)
        logger.info(f"Started Redis subscriber thread for channels: {CHANNELS}")
    except Exception as e:
        logger.warning(f"Redis subscriber failed to start (Redis may not be running): {e}")

async def stop_redis_subscriber():
    global _pubsub_thread
    if _pubsub_thread:
        _pubsub_thread.stop()
        _pubsub_thread = None
        logger.info("Stopped Redis subscriber thread")
