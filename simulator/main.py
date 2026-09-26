"""
okDriver CCTV Simulator — main entry point.
Starts:
  - FastAPI health endpoint on port 8001
  - Analytics event loop (background thread)
  - Health/heartbeat loop (background thread)
"""
import threading
import time
import logging
import uvicorn
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="okdriver Simulator")


@app.get("/health")
def health():
    return {"status": "ok"}


def _run_analytics():
    """Wait for backend to be ready, then run the analytics event loop."""
    import os, requests
    backend_url = os.getenv("BACKEND_URL", "http://backend:8000")
    for attempt in range(30):
        try:
            r = requests.get(f"{backend_url}/health", timeout=5)
            if r.status_code == 200:
                logger.info("Backend is ready. Starting analytics simulator.")
                break
        except Exception:
            pass
        logger.info(f"Waiting for backend... attempt {attempt + 1}/30")
        time.sleep(5)
    else:
        logger.error("Backend never became ready. Analytics simulator NOT started.")
        return

    from analytics_simulator import main as analytics_main
    try:
        analytics_main()
    except Exception as e:
        logger.exception(f"Analytics simulator crashed: {e}")


def _run_health():
    """Wait for backend to be ready, then run the health/heartbeat loop."""
    import os, requests
    backend_url = os.getenv("BACKEND_URL", "http://backend:8000")
    for attempt in range(30):
        try:
            r = requests.get(f"{backend_url}/health", timeout=5)
            if r.status_code == 200:
                logger.info("Backend is ready. Starting health simulator.")
                break
        except Exception:
            pass
        time.sleep(5)

    from health_simulator import run_loop as health_loop
    try:
        health_loop()
    except Exception as e:
        logger.exception(f"Health simulator crashed: {e}")


if __name__ == "__main__":
    # Start background loops
    t_analytics = threading.Thread(target=_run_analytics, daemon=True, name="analytics")
    t_health = threading.Thread(target=_run_health, daemon=True, name="health")
    t_analytics.start()
    t_health.start()

    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")