"""
Analytics Simulator for Phase 7.
Simulates AI edge analytics pushing events to the backend.
"""
import os
import time
import random
import uuid
import datetime
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

API_URL = os.getenv("API_URL", "http://localhost:8000/api/v1")
ANALYTICS_API_KEY = os.getenv("ANALYTICS_API_KEY", "phase7-dev-analytics-key")

# Typical plates to simulate
# We include plates from the watchlist seed to trigger alerts!
PLATES = [
    "GJ01XX0001",  # Watchlist critical (blacklisted)
    "MH12AB1234",  # Watchlist high (stolen)
    "DL01CD5678",  # Watchlist high (stolen)
    "GJ05KL2345",  # Watchlist high (blacklisted)
    "PERSON-WANTED-001", # Watchlist person
    "GJ01AA1111",  # Normal plate
    "MH02BB2222",  # Normal plate
    "DL03CC3333",  # Normal plate
    "KA04DD4444",  # Normal plate
    "UP32EE5555",  # Normal plate
]

# Fetch active cameras
def get_cameras():
    try:
        # We need an admin token to fetch cameras if it's protected, 
        # but simulator might just use known IDs or we can authenticate.
        # For simplicity, we just use some known IDs from the seed.
        return ["CAM-001", "CAM-002", "CAM-003", "DEMO-001"]
    except Exception as e:
        print(f"Error fetching cameras: {e}")
        return ["CAM-001", "CAM-002"]

def push_event(camera_id, plate, is_person=False):
    event_id = str(uuid.uuid4())
    payload = {
        "event_id": event_id,
        "camera_id": camera_id,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "event_type": "person" if is_person else "anpr",
        "confidence": round(random.uniform(0.85, 0.99), 2),
        "vehicle_number": plate if not is_person else None,
        "vehicle_type": "car" if not is_person else None,
        "bounding_box": {
            "x": random.randint(10, 500),
            "y": random.randint(10, 500),
            "width": random.randint(50, 150),
            "height": random.randint(20, 50)
        }
    }
    
    headers = {
        "X-Analytics-Key": ANALYTICS_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        resp = requests.post(f"{API_URL}/events", json=payload, headers=headers)
        if resp.status_code == 202:
            data = resp.json()
            if data.get("alert_created"):
                print(f"[ALERT TRIGGERED] {plate} on {camera_id} (Alert ID: {data['alert_id']})")
            elif data.get("duplicate"):
                print(f"[DUPLICATE] Event {event_id} suppressed")
            else:
                print(f"[OK] Event sent: {plate} on {camera_id}")
        else:
            print(f"[ERROR] {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"[FAIL] Connection error: {e}")

def main():
    print(f"Starting Phase 7 Analytics Simulator...")
    print(f"Target URL: {API_URL}/events")
    
    cameras = get_cameras()
    print(f"Using cameras: {cameras}")
    
    while True:
        try:
            # Randomly select a camera and a plate
            camera_id = random.choice(cameras)
            plate = random.choice(PLATES)
            is_person = plate.startswith("PERSON-")
            
            push_event(camera_id, plate, is_person)
            
            # Sleep between 2 to 10 seconds
            time.sleep(random.uniform(2.0, 10.0))
        except KeyboardInterrupt:
            print("Stopping simulator.")
            break

if __name__ == "__main__":
    main()
