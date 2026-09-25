"""
Watchlist service — Phase 7.
Handles CRUD, matching, CSV import and seeding.
"""
import csv
import io
import logging
from datetime import datetime, timezone
from math import ceil
from typing import Optional, Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.alerts import WatchlistEntry
from app.models.cameras import CameraAuditLog
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate, WatchlistImportResult
from app.schemas.events import normalize_plate

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _audit(db: Session, user_id: Any, action: str, resource_id: str, old: Any = None, new: Any = None):
    try:
        log = CameraAuditLog(
            camera_id="SYSTEM",
            user_id=user_id,
            action=action,
            resource_type="watchlist",
            resource_id=resource_id,
            old_value=old,
            new_value=new,
            timestamp=_utcnow(),
        )
        db.add(log)
    except Exception as e:
        logger.warning(f"Audit failed: {e}")


# ── CRUD ──────────────────────────────────────────────────────────────────────

def create_entry(db: Session, data: WatchlistCreate, user_id: Any = None) -> WatchlistEntry:
    existing = db.query(WatchlistEntry).filter(
        WatchlistEntry.identifier == data.identifier,
        WatchlistEntry.entity_type == data.entity_type,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Watchlist entry for '{data.identifier}' already exists")

    entry = WatchlistEntry(
        entity_type=data.entity_type,
        identifier=data.identifier,
        category=data.category,
        severity=data.severity,
        description=data.description,
        reference_case_no=data.reference_case_no,
        added_by=data.added_by,
        is_active=data.is_active,
        expires_at=data.expires_at.replace(tzinfo=None) if data.expires_at else None,
    )
    db.add(entry)
    db.flush()
    _audit(db, user_id, "WATCHLIST_CREATE", str(entry.id), new={"identifier": data.identifier, "category": data.category})
    db.commit()
    db.refresh(entry)
    return entry


import uuid

def get_entry(db: Session, entry_id: str) -> WatchlistEntry:
    if isinstance(entry_id, str):
        entry_id = uuid.UUID(entry_id)
    entry = db.query(WatchlistEntry).filter(WatchlistEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Watchlist entry not found")
    return entry


def list_entries(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    entity_type: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    q = db.query(WatchlistEntry)
    if search:
        q = q.filter(WatchlistEntry.identifier.ilike(f"%{search}%"))
    if entity_type:
        q = q.filter(WatchlistEntry.entity_type == entity_type)
    if category:
        q = q.filter(WatchlistEntry.category == category)
    if severity:
        q = q.filter(WatchlistEntry.severity == severity)
    if is_active is not None:
        q = q.filter(WatchlistEntry.is_active == is_active)
    total = q.count()
    items = q.order_by(WatchlistEntry.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total, ceil(total / page_size) if total else 1


def update_entry(db: Session, entry_id: str, data: WatchlistUpdate, user_id: Any = None) -> WatchlistEntry:
    entry = get_entry(db, entry_id)
    old_val = {"identifier": entry.identifier, "category": entry.category, "is_active": entry.is_active}
    for field, value in data.model_dump(exclude_none=True).items():
        if field == "expires_at" and value:
            value = value.replace(tzinfo=None)
        setattr(entry, field, value)
    entry.updated_at = _utcnow()
    _audit(db, user_id, "WATCHLIST_UPDATE", str(entry.id), old=old_val, new=data.model_dump(exclude_none=True))
    db.commit()
    db.refresh(entry)
    return entry


def deactivate_entry(db: Session, entry_id: str, user_id: Any = None) -> WatchlistEntry:
    entry = get_entry(db, entry_id)
    if not entry.is_active:
        raise HTTPException(status_code=400, detail="Entry is already inactive")
    entry.is_active = False
    entry.updated_at = _utcnow()
    _audit(db, user_id, "WATCHLIST_DISABLE", str(entry.id))
    db.commit()
    db.refresh(entry)
    return entry


# ── MATCHING ──────────────────────────────────────────────────────────────────

def match_identifier(db: Session, identifier: str) -> Optional[WatchlistEntry]:
    """Exact match against active, non-expired entries. Uses DB index."""
    now = _utcnow()
    entry = db.query(WatchlistEntry).filter(
        WatchlistEntry.identifier == identifier,
        WatchlistEntry.is_active == True,
    ).filter(
        (WatchlistEntry.expires_at == None) | (WatchlistEntry.expires_at > now)
    ).first()
    return entry


# ── CSV IMPORT ────────────────────────────────────────────────────────────────

def import_csv(db: Session, csv_bytes: bytes, user_id: Any = None) -> WatchlistImportResult:
    text = csv_bytes.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    created = 0
    updated = 0
    skipped = 0
    errors: list[dict] = []

    for i, row in enumerate(reader, start=2):  # row 1 = header
        try:
            raw_id = row.get("identifier", "").strip()
            entity_type = row.get("entity_type", "vehicle").strip() or "vehicle"
            identifier = normalize_plate(raw_id) if entity_type == "vehicle" else raw_id.upper()
            category = row.get("category", "blacklisted").strip()
            severity = row.get("severity", "medium").strip()
            description = row.get("description", "").strip() or None
            reference_case_no = row.get("reference_case_no", "").strip() or None
            added_by = row.get("added_by", "csv_import").strip() or "csv_import"

            if not identifier:
                errors.append({"row": i, "error": "identifier is empty"})
                skipped += 1
                continue

            existing = db.query(WatchlistEntry).filter(
                WatchlistEntry.identifier == identifier,
                WatchlistEntry.entity_type == entity_type,
            ).first()

            if existing:
                existing.category = category
                existing.severity = severity
                existing.description = description
                existing.reference_case_no = reference_case_no
                existing.updated_at = _utcnow()
                updated += 1
            else:
                entry = WatchlistEntry(
                    entity_type=entity_type,
                    identifier=identifier,
                    category=category,
                    severity=severity,
                    description=description,
                    reference_case_no=reference_case_no,
                    added_by=added_by,
                    is_active=True,
                )
                db.add(entry)
                created += 1

        except Exception as e:
            errors.append({"row": i, "error": str(e)})
            skipped += 1

    db.commit()
    _audit(db, user_id, "WATCHLIST_IMPORT", "bulk", new={"created": created, "updated": updated, "skipped": skipped})
    return WatchlistImportResult(created=created, updated=updated, skipped=skipped, errors=errors)


# ── SEED ──────────────────────────────────────────────────────────────────────

SEED_DATA = [
    # Demo vehicle for blacklist
    {"entity_type": "vehicle", "identifier": "GJ01XX0001", "category": "blacklisted", "severity": "critical",
     "description": "Demo blacklisted vehicle — okdriver Phase 7 demo", "reference_case_no": "FIR-2026-001"},
    # Stolen vehicles
    {"entity_type": "vehicle", "identifier": "MH12AB1234", "category": "stolen", "severity": "high",
     "description": "Stolen SUV — Mumbai case", "reference_case_no": "FIR-2026-002"},
    {"entity_type": "vehicle", "identifier": "DL01CD5678", "category": "stolen", "severity": "high",
     "description": "Stolen sedan — Delhi case", "reference_case_no": "FIR-2026-003"},
    {"entity_type": "vehicle", "identifier": "KA04EF9012", "category": "stolen", "severity": "medium",
     "description": "Stolen motorcycle — Bangalore", "reference_case_no": "FIR-2026-004"},
    {"entity_type": "vehicle", "identifier": "TN09GH3456", "category": "stolen", "severity": "medium",
     "description": "Stolen truck — Chennai", "reference_case_no": "FIR-2026-005"},
    {"entity_type": "vehicle", "identifier": "RJ14IJ7890", "category": "stolen", "severity": "high",
     "description": "Stolen luxury vehicle — Jaipur", "reference_case_no": "FIR-2026-006"},
    # Blacklisted vehicles
    {"entity_type": "vehicle", "identifier": "GJ05KL2345", "category": "blacklisted", "severity": "high",
     "description": "Smuggling suspect vehicle", "reference_case_no": "FIR-2026-007"},
    {"entity_type": "vehicle", "identifier": "UP32MN6789", "category": "blacklisted", "severity": "critical",
     "description": "Organized crime vehicle — red notice", "reference_case_no": "FIR-2026-008"},
    {"entity_type": "vehicle", "identifier": "HR26OP0123", "category": "blacklisted", "severity": "high",
     "description": "Known trafficking vehicle", "reference_case_no": "FIR-2026-009"},
    {"entity_type": "vehicle", "identifier": "PB10QR4567", "category": "blacklisted", "severity": "medium",
     "description": "Counterfeit goods transporter", "reference_case_no": "FIR-2026-010"},
    # Wanted persons
    {"entity_type": "person", "identifier": "PERSON-WANTED-001", "category": "wanted", "severity": "critical",
     "description": "Suspect — armed robbery", "reference_case_no": "FIR-2026-011"},
    {"entity_type": "person", "identifier": "PERSON-WANTED-002", "category": "wanted", "severity": "high",
     "description": "Fraud suspect — financial crimes", "reference_case_no": "FIR-2026-012"},
    {"entity_type": "person", "identifier": "PERSON-WANTED-003", "category": "wanted", "severity": "high",
     "description": "Cybercrime suspect", "reference_case_no": "FIR-2026-013"},
    # Missing persons
    {"entity_type": "person", "identifier": "PERSON-MISSING-001", "category": "missing", "severity": "high",
     "description": "Missing person — family case", "reference_case_no": "MP-2026-001"},
    {"entity_type": "person", "identifier": "PERSON-MISSING-002", "category": "missing", "severity": "medium",
     "description": "Missing person — dementia patient", "reference_case_no": "MP-2026-002"},
    # Additional vehicles for demo diversity
    {"entity_type": "vehicle", "identifier": "GJ01YY9999", "category": "stolen", "severity": "low",
     "description": "Auto-rickshaw — local theft", "reference_case_no": "FIR-2026-014"},
    {"entity_type": "vehicle", "identifier": "MH01ZZ0001", "category": "blacklisted", "severity": "medium",
     "description": "Tax evasion suspect", "reference_case_no": "FIR-2026-015"},
    {"entity_type": "vehicle", "identifier": "GJ09AA1111", "category": "stolen", "severity": "high",
     "description": "Stolen commercial vehicle", "reference_case_no": "FIR-2026-016"},
    {"entity_type": "vehicle", "identifier": "BR01BB2222", "category": "blacklisted", "severity": "high",
     "description": "Mining vehicle — illegal operations", "reference_case_no": "FIR-2026-017"},
    {"entity_type": "vehicle", "identifier": "WB20CC3333", "category": "stolen", "severity": "medium",
     "description": "Stolen taxi — Kolkata", "reference_case_no": "FIR-2026-018"},
]


def seed_watchlist(db: Session) -> dict:
    created = 0
    skipped = 0
    for item in SEED_DATA:
        existing = db.query(WatchlistEntry).filter(
            WatchlistEntry.identifier == item["identifier"],
            WatchlistEntry.entity_type == item["entity_type"],
        ).first()
        if existing:
            skipped += 1
            continue
        entry = WatchlistEntry(**item, is_active=True, added_by="system_seed")
        db.add(entry)
        created += 1
    db.commit()
    return {"created": created, "skipped": skipped, "total": len(SEED_DATA)}
