import requests
import time
import datetime
import os
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_URL = os.getenv("API_URL", "http://localhost:8000")
API_KEY = os.getenv("HEARTBEAT_API_KEY", "service-key-for-heartbeat")

CAMERAS = ["C001", "C002"]
MODE = os.getenv("SIMULATOR_MODE", "NORMAL") # NORMAL, DEGRADED, STOPPED

def send_heartbeat(camera_id: str):
    if MODE == "STOPPED":
        return

    now = datetime.datetime.now(datetime.timezone.utc)
    
    if MODE == "NORMAL":
        fps = 25.0 + random.uniform(-1, 1)
        latency = int(random.uniform(50, 100))
        packet_loss = 0.0
    elif MODE == "DEGRADED":
        fps = 8.0 + random.uniform(-1, 1)
        latency = int(random.uniform(800, 1500))
        packet_loss = 8.0
    else:
        fps = 15.0
        latency = 100
        packet_loss = 0.0

    payload = {
        "timestamp": now.isoformat(),
        "fps": fps,
        "bitrate": 1800.0,
        "latency_ms": latency,
        "packet_loss": packet_loss
    }

    try:
        resp = requests.post(
            f"{API_URL}/api/cameras/{camera_id}/heartbeat",
            json=payload,
            headers={"Authorization": f"Bearer {API_KEY}"}
        )
        if resp.status_code == 200:
            logger.info(f"[{camera_id}] Heartbeat accepted: {resp.json()['status']}")
        else:
            logger.warning(f"[{camera_id}] Heartbeat rejected: {resp.status_code} {resp.text}")
    except Exception as e:
        logger.error(f"[{camera_id}] Heartbeat error: {e}")

if __name__ == "__main__":
    logger.info(f"Starting Health Simulator in mode {MODE}...")
    while True:
        for cam in CAMERAS:
            send_heartbeat(cam)
        time.sleep(10)
