from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.responses import JSONResponse

from sqlalchemy import text

from app.api.auth import router as auth_router
from app.api.cameras import router as cameras_router
from app.api.events import router as events_router
from app.api.watchlist import router as watchlist_router
from app.api.alerts import router as alerts_router
from app.api.ws import router as ws_router
from app.api.stats import router as stats_router
from app.api.entities import router as entities_router
from app.api.audit import router as audit_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.redis import get_redis

import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.workers.health_monitor import health_monitor_loop
    from app.realtime.subscriber import start_redis_subscriber, stop_redis_subscriber
    task_health = asyncio.create_task(health_monitor_loop())
    await start_redis_subscriber()
    yield
    task_health.cancel()
    await stop_redis_subscriber()

app = FastAPI(
    title="okdriver CCTV Platform",
    description="Centralized CCTV monitoring and video analytics backend.",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("CORS_ORIGINS", "http://localhost:5173"),
        "http://localhost:5174",
        "http://localhost:5173",
    ],  # Phase 10: Strict CORS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org; connect-src 'self' ws: wss:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    return response

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(cameras_router)
app.include_router(events_router)
app.include_router(watchlist_router)
app.include_router(alerts_router)
app.include_router(ws_router)
app.include_router(stats_router)
app.include_router(entities_router)
app.include_router(audit_router)


@app.get("/health", tags=["system"])
def health_check():
    """Returns status of the API, database, and Redis connections."""
    db_status = "ok"
    redis_status = "ok"

    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = str(e)

    try:
        r = get_redis()
        r.ping()
    except Exception as e:
        redis_status = str(e)

    overall = "ok" if db_status == "ok" and redis_status == "ok" else "degraded"
    return {
        "status": overall,
        "database": db_status,
        "redis": redis_status,
    }