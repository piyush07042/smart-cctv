"""
Analytics Simulator for Phase 7.
Simulates AI edge analytics pushing events to the backend.
Runs continuously, generating events every 1-3 seconds.
"""
import os
import time
import random
import uuid
import datetime
import logging
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")
ANALYTICS_API_KEY = os.getenv("ANALYTICS_API_KEY", "analytics-service-key")

# Camera IDs matching the seeded cameras
CAMERAS = ["C001", "C002", "C003", "C005", "C007", "C009"]

# Plates — include watchlist plate GJ01XX0001 frequently to trigger alerts
PLATES = [
    "GJ01XX0001",   # watchlist — will trigger alert
    "GJ01XX0001",   # extra weight so it appears ~20% of the time
    "MH12AB1234",
    "DL01CD5678",
    "GJ05KL2345",
    "GJ01AA1111",
    "MH02BB2222",
    "DL03CC3333",
    "KA04DD4444",
    "UP32EE5555",
    "RJ14GH7890",
    "TN09JK3210",
]

# Keep a small recent-event buffer to occasionally re-send (dedup demo)
_recent_event_ids: list[str] = []


def push_event(camera_id: str, plate: str, reuse_id: str | None = None) -> None:
    event_id = reuse_id or str(uuid.uuid4())
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "event_id": event_id,
        "camera_id": camera_id,
        "timestamp": now_utc.isoformat(),
        "event_type": "anpr",
        "confidence": round(random.uniform(0.85, 0.99), 2),
        "vehicle_number": plate,
        "vehicle_type": random.choice(["car", "truck", "motorcycle", "bus"]),
        "bounding_box": {
            "x": float(random.randint(10, 500)),
            "y": float(random.randint(10, 300)),
            "w": float(random.randint(80, 200)),
            "h": float(random.randint(30, 80)),
        },
    }

    headers = {
        "X-Analytics-Key": ANALYTICS_API_KEY,
        "Content-Type": "application/json",
    }

    label = "[DUP ]" if reuse_id else "[NEW ]"
    try:
        resp = requests.post(
            f"{BACKEND_URL}/events",
            json=payload,
            headers=headers,
            timeout=10,
        )
        if resp.status_code == 202:
            data = resp.json()
            if data.get("alert_created"):
                logger.info(f"[ALERT] {plate} on {camera_id} → Alert {data.get('alert_id')}")
            elif data.get("duplicate"):
                logger.info(f"[DEDUP] {plate} on {camera_id} — suppressed as duplicate")
            else:
                logger.info(f"{label} {plate} on {camera_id} → accepted")
        else:
            logger.warning(f"{label} {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.error(f"{label} Connection error: {e}")


def main() -> None:
    logger.info(f"Analytics Simulator started → {BACKEND_URL}/events")
    logger.info(f"API key: {ANALYTICS_API_KEY[:8]}...")

    tick = 0
    while True:
        try:
            camera_id = random.choice(CAMERAS)
            plate = random.choice(PLATES)

            # Every ~10th event, re-send a recent event_id to exercise deduplication
            if tick % 10 == 9 and _recent_event_ids:
                old_id = random.choice(_recent_event_ids)
                push_event(camera_id, plate, reuse_id=old_id)
            else:
                new_id = str(uuid.uuid4())
                _recent_event_ids.append(new_id)
                if len(_recent_event_ids) > 20:
                    _recent_event_ids.pop(0)
                push_event(camera_id, plate)

            tick += 1
            time.sleep(random.uniform(1.0, 3.0))

        except KeyboardInterrupt:
            logger.info("Simulator stopped.")
            break
        except Exception as e:
            logger.exception(f"Unexpected error in analytics loop: {e}")
            time.sleep(5)


if __name__ == "__main__":
    main()
