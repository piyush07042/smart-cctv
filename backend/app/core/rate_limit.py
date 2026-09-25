from fastapi import Request, HTTPException
from app.core.redis import get_redis
import time

def check_rate_limit(key: str, limit: int, window: int):
    r = get_redis()
    current = int(time.time())
    window_start = current - window

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zadd(key, {str(current) + "-" + str(time.time()): current})
    pipe.zcard(key)
    pipe.expire(key, window)
    results = pipe.execute()

    count = results[2]
    if count > limit:
        raise HTTPException(status_code=429, detail="Too Many Requests")
