"""
Health / Heartbeat Simulator for Phase 6.
Sends heartbeat metrics for C001 and C002 every 10 seconds.
C001 → NORMAL (ONLINE)
C002 → NORMAL (ONLINE)
"""
import requests
import time
import datetime
import os
import random
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# docker-compose passes BACKEND_URL; fall back for local runs
BACKEND_URL = os.getenv("BACKEND_URL", os.getenv("API_URL", "http://backend:8000"))
# Heartbeat API key must match backend settings.HEARTBEAT_API_KEY
HEARTBEAT_API_KEY = os.getenv("HEARTBEAT_API_KEY", "service-key-for-heartbeat")

CAMERAS = ["C001", "C002"]


def send_heartbeat(camera_id: str) -> None:
    now = datetime.datetime.now(datetime.timezone.utc)
    fps = 25.0 + random.uniform(-1.5, 1.5)
    latency = int(random.uniform(40, 120))
    packet_loss = round(random.uniform(0.0, 0.5), 2)

    payload = {
        "timestamp": now.isoformat(),
        "fps": round(fps, 2),
        "bitrate": 1800.0,
        "latency_ms": latency,
        "packet_loss": packet_loss,
    }

    try:
        resp = requests.post(
            f"{BACKEND_URL}/cameras/{camera_id}/heartbeat",
            json=payload,
            headers={"Authorization": f"Bearer {HEARTBEAT_API_KEY}"},
            timeout=10,
        )
        if resp.status_code == 200:
            logger.info(f"[HB] {camera_id} → {resp.json().get('status', 'ok')}")
        else:
            logger.warning(f"[HB] {camera_id} rejected: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        logger.error(f"[HB] {camera_id} error: {e}")


def run_loop() -> None:
    """Public entry point called from main.py background thread."""
    logger.info(f"Health Simulator started → {BACKEND_URL}")
    logger.info(f"Heartbeat key: {HEARTBEAT_API_KEY[:8]}...")
    while True:
        for cam in CAMERAS:
            send_heartbeat(cam)
        time.sleep(10)


if __name__ == "__main__":
    run_loop()
