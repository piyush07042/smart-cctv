"""
Camera seed data — Phase 3.

Seeds ~10 realistic cameras across Ahmedabad, Gandhinagar, and Vadodara.
Idempotent: running multiple times does NOT create duplicates.
"""
import logging
from app.core.database import SessionLocal
from app.models.cameras import Camera
from app.models.enums import CameraType, SourceProtocol, CameraStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEED_CAMERAS = [
    {
        "camera_id": "C001",
        "name": "Traffic Junction — Ahmedabad CG Road",
        "department": "Traffic",
        "latitude": 23.0335,
        "longitude": 72.5620,
        "camera_type": CameraType.ANPR.value,
        "source_protocol": SourceProtocol.RTSP.value,
        "stream_endpoint_ref": "rtsp://mediamtx:8554/c001",
        "status": CameraStatus.ONLINE.value,
        "zone": "Zone-A",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 30, "tier": "hot"},
    },
    {
        "camera_id": "C002",
        "name": "RTO Checkpoint — Ahmedabad East",
        "department": "Transport",
        "latitude": 23.0172,
        "longitude": 72.6066,
        "camera_type": CameraType.ANPR.value,
        "source_protocol": SourceProtocol.RTSP.value,
        "stream_endpoint_ref": "rtsp://mediamtx:8554/c002",
        "status": CameraStatus.ONLINE.value,
        "zone": "Zone-B",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 30, "tier": "hot"},
    },
    {
        "camera_id": "C003",
        "name": "SG Highway Junction — Ahmedabad",
        "department": "Traffic",
        "latitude": 23.0547,
        "longitude": 72.5199,
        "camera_type": CameraType.PTZ.value,
        "source_protocol": SourceProtocol.ONVIF.value,
        "stream_endpoint_ref": "rtsp://mediamtx:8554/c003",
        "status": CameraStatus.ONLINE.value,
        "zone": "Zone-A",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 14, "tier": "warm"},
    },
    {
        "camera_id": "C004",
        "name": "Sardar Patel Ring Road — Entry Gate",
        "department": "Traffic",
        "latitude": 23.0713,
        "longitude": 72.5010,
        "camera_type": CameraType.FIXED.value,
        "source_protocol": SourceProtocol.HLS.value,
        "stream_endpoint_ref": "https://stream.example.com/c004/playlist.m3u8",
        "status": CameraStatus.DEGRADED.value,
        "zone": "Zone-C",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 7, "tier": "cold"},
    },
    {
        "camera_id": "C005",
        "name": "Gandhinagar Sector-21 Junction",
        "department": "Traffic",
        "latitude": 23.2156,
        "longitude": 72.6369,
        "camera_type": CameraType.ANPR.value,
        "source_protocol": SourceProtocol.RTSP.value,
        "stream_endpoint_ref": "rtsp://mediamtx:8554/c005",
        "status": CameraStatus.ONLINE.value,
        "zone": "Gandhinagar-North",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 30, "tier": "hot"},
    },
    {
        "camera_id": "C006",
        "name": "Gandhinagar Collectorate Gate",
        "department": "Secretariat",
        "latitude": 23.2270,
        "longitude": 72.6506,
        "camera_type": CameraType.PTZ.value,
        "source_protocol": SourceProtocol.ONVIF.value,
        "stream_endpoint_ref": "rtsp://mediamtx:8554/c006",
        "status": CameraStatus.ONLINE.value,
        "zone": "Gandhinagar-South",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 90, "tier": "hot"},
    },
    {
        "camera_id": "C007",
        "name": "Vadodara Traffic Junction — Sayajigunj",
        "department": "Traffic",
        "latitude": 22.3119,
        "longitude": 73.1894,
        "camera_type": CameraType.ANPR.value,
        "source_protocol": SourceProtocol.RTSP.value,
        "stream_endpoint_ref": "rtsp://mediamtx:8554/c007",
        "status": CameraStatus.ONLINE.value,
        "zone": "Vadodara-Central",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 30, "tier": "hot"},
    },
    {
        "camera_id": "C008",
        "name": "Vadodara Railway Station — North Entrance",
        "department": "Railway",
        "latitude": 22.3217,
        "longitude": 73.1971,
        "camera_type": CameraType.FIXED.value,
        "source_protocol": SourceProtocol.VENDOR_API.value,
        "stream_endpoint_ref": "https://api.vendor-railway.example.com/cam/c008/feed",
        "status": CameraStatus.OFFLINE.value,
        "zone": "Vadodara-Central",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 14, "tier": "warm"},
    },
    {
        "camera_id": "C009",
        "name": "Ahmedabad Airport Entry Gate",
        "department": "Aviation Security",
        "latitude": 23.0771,
        "longitude": 72.6342,
        "camera_type": CameraType.ANPR.value,
        "source_protocol": SourceProtocol.RTSP.value,
        "stream_endpoint_ref": "rtsp://mediamtx:8554/c009",
        "status": CameraStatus.ONLINE.value,
        "zone": "Zone-D",
        "is_enabled": True,
        "storage_metadata": {"retention_days": 60, "tier": "hot"},
    },
    {
        "camera_id": "C010",
        "name": "Dashcam — Mobile Patrol Unit 01",
        "department": "Traffic",
        "latitude": None,
        "longitude": None,
        "camera_type": CameraType.DASHCAM.value,
        "source_protocol": SourceProtocol.WEBRTC.value,
        "stream_endpoint_ref": "https://webrtc.fleet.example.com/sessions/unit01",
        "status": CameraStatus.OFFLINE.value,
        "zone": "Mobile",
        "is_enabled": False,
        "storage_metadata": {"retention_days": 7, "tier": "cold"},
    },
]


def seed_cameras(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    try:
        created = 0
        skipped = 0
        for data in SEED_CAMERAS:
            existing = db.query(Camera).filter(Camera.camera_id == data["camera_id"]).first()
            if existing:
                skipped += 1
                continue
            cam = Camera(**data)
            db.add(cam)
            created += 1
        db.commit()
        logger.info(f"Camera seed complete — created: {created}, skipped (already existed): {skipped}")
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_cameras()
