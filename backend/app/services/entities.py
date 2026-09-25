"""
Entity search and vehicle trace service — Phase 9.
"""
import logging
import re
from datetime import datetime, timezone, timedelta
from math import ceil, radians, sin, cos, sqrt, atan2
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.events import DetectionEvent
from app.models.cameras import Camera
from app.schemas.events import normalize_plate

logger = logging.getLogger(__name__)

# Maximum allowed export / trace time range: 30 days
MAX_TRACE_DAYS = 30
MAX_SEARCH_RESULTS = 500
MAX_EXPORT_ROWS = 5000
MAX_EXPORT_DAYS = 30

# Implausible speed threshold (km/h) — adjust in config if needed
IMPLAUSIBLE_SPEED_KMH = 300.0


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points (km)."""
    R = 6371.0
    φ1, φ2 = radians(lat1), radians(lat2)
    dφ = radians(lat2 - lat1)
    dλ = radians(lon2 - lon1)
    a = sin(dφ / 2) ** 2 + cos(φ1) * cos(φ2) * sin(dλ / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def _normalize_query(q: str) -> str:
    """Normalize a search query — strip, uppercase, remove wildcards for exact search."""
    return re.sub(r"[\s\-]", "", q.strip()).upper()


def search_entities(
    db: Session,
    *,
    q: str,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    camera_id: Optional[str] = None,
    event_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """
    Search for entity sightings by vehicle number / partial plate.
    Supports % wildcard at start/end for partial matching.
    """
    if not q or not q.strip():
        raise HTTPException(status_code=422, detail="Search query 'q' is required")

    # Determine whether to do exact or LIKE match
    raw = q.strip().upper()
    is_partial = "*" in raw or "%" in raw
    normalized = re.sub(r"[\s\-*%]", "", raw)  # strip wildcards for normalization

    query = db.query(DetectionEvent).join(
        Camera, DetectionEvent.camera_id == Camera.camera_id, isouter=True
    )

    if is_partial:
        # Convert * to SQL LIKE wildcard %
        like_pattern = re.sub(r"\*", "%", raw)
        like_pattern = re.sub(r"[\s\-]", "", like_pattern)
        query = query.filter(DetectionEvent.vehicle_number.like(like_pattern))
    else:
        query = query.filter(DetectionEvent.vehicle_number == normalized)

    if from_ts:
        query = query.filter(DetectionEvent.timestamp >= from_ts.replace(tzinfo=None))
    if to_ts:
        query = query.filter(DetectionEvent.timestamp <= to_ts.replace(tzinfo=None))
    if camera_id:
        query = query.filter(DetectionEvent.camera_id == camera_id)
    if event_type:
        query = query.filter(DetectionEvent.event_type == event_type.lower())

    total = query.count()
    pages = max(1, ceil(total / page_size))
    items = (
        query.order_by(DetectionEvent.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Enrich with camera info
    cam_ids = list({e.camera_id for e in items})
    cameras = {
        c.camera_id: c
        for c in db.query(Camera).filter(Camera.camera_id.in_(cam_ids)).all()
    }

    sightings = []
    for e in items:
        cam = cameras.get(e.camera_id)
        sightings.append({
            "id": str(e.id),
            "timestamp": e.timestamp.isoformat(),
            "camera_id": e.camera_id,
            "camera_name": cam.name if cam else e.camera_id,
            "latitude": cam.latitude if cam else None,
            "longitude": cam.longitude if cam else None,
            "vehicle_number": e.vehicle_number,
            "vehicle_type": e.vehicle_type,
            "event_type": e.event_type,
            "confidence": e.confidence,
        })

    return {
        "query": raw,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "sightings": sightings,
    }


def get_vehicle_trace(
    db: Session,
    *,
    plate: str,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
) -> dict:
    """
    Return chronological sightings for a specific vehicle plate.
    Includes camera coordinates, confidence, and hop analysis.
    """
    normalized = normalize_plate(plate)
    if not normalized:
        raise HTTPException(status_code=422, detail="Invalid plate identifier")

    # Default time range: last 24h
    if not to_ts:
        to_ts = _utcnow()
    if not from_ts:
        from_ts = to_ts - timedelta(hours=24)

    # Enforce max range
    if (to_ts - from_ts).days > MAX_TRACE_DAYS:
        raise HTTPException(
            status_code=422,
            detail=f"Time range must not exceed {MAX_TRACE_DAYS} days"
        )

    events = (
        db.query(DetectionEvent)
        .filter(
            DetectionEvent.vehicle_number == normalized,
            DetectionEvent.timestamp >= from_ts.replace(tzinfo=None),
            DetectionEvent.timestamp <= to_ts.replace(tzinfo=None),
        )
        .order_by(DetectionEvent.timestamp.asc())
        .limit(MAX_SEARCH_RESULTS)
        .all()
    )

    # Enrich with camera info
    cam_ids = list({e.camera_id for e in events})
    cameras = {
        c.camera_id: c
        for c in db.query(Camera).filter(Camera.camera_id.in_(cam_ids)).all()
    } if cam_ids else {}

    sightings = []
    for i, e in enumerate(events):
        cam = cameras.get(e.camera_id)
        sighting = {
            "seq": i + 1,
            "timestamp": e.timestamp.isoformat(),
            "event_id": str(e.id),
            "camera_id": e.camera_id,
            "camera_name": cam.name if cam else e.camera_id,
            "latitude": cam.latitude if cam else None,
            "longitude": cam.longitude if cam else None,
            "confidence": e.confidence,
            "event_type": e.event_type,
            "vehicle_type": e.vehicle_type,
        }

        # Hop analysis vs previous sighting
        if i > 0:
            prev = sightings[i - 1]
            prev_dt = datetime.fromisoformat(prev["timestamp"])
            curr_dt = e.timestamp
            elapsed_seconds = (curr_dt - prev_dt).total_seconds()
            elapsed_minutes = elapsed_seconds / 60.0

            distance_km = None
            speed_kmh = None
            implausible = False

            if (
                prev.get("latitude") is not None and prev.get("longitude") is not None
                and cam and cam.latitude is not None and cam.longitude is not None
            ):
                distance_km = round(
                    _haversine_km(prev["latitude"], prev["longitude"], cam.latitude, cam.longitude),
                    3
                )
                if elapsed_seconds > 0:
                    speed_kmh = round(distance_km / (elapsed_seconds / 3600.0), 1)
                    implausible = speed_kmh > IMPLAUSIBLE_SPEED_KMH

            sighting["hop"] = {
                "from_camera": prev["camera_id"],
                "elapsed_seconds": round(elapsed_seconds),
                "elapsed_minutes": round(elapsed_minutes, 1),
                "distance_km": distance_km,
                "speed_kmh": speed_kmh,
                "implausible_speed": implausible,
                "note": (
                    "Implausible travel speed — requires review"
                    if implausible else None
                ),
            }
        else:
            sighting["hop"] = None

        sightings.append(sighting)

    return {
        "plate": normalized,
        "from": from_ts.isoformat(),
        "to": to_ts.isoformat(),
        "total_sightings": len(sightings),
        "route_note": "Reconstructed route — straight-line geographic approximation between camera sightings.",
        "sightings": sightings,
    }
