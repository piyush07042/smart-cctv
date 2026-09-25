"""
Watchlist API router — Phase 7.
"""
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.users import User
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate, WatchlistResponse, WatchlistListResponse, WatchlistImportResult
from app.services import watchlist as watchlist_svc

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.post("", response_model=WatchlistResponse, status_code=201)
def create_entry(
    data: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin only: Create a new watchlist entry."""
    return watchlist_svc.create_entry(db, data, current_user.id)


@router.get("", response_model=WatchlistListResponse)
def list_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    entity_type: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List watchlist entries (requires auth)."""
    items, total, pages = watchlist_svc.list_entries(
        db, page, page_size, search, entity_type, category, severity, is_active
    )
    return WatchlistListResponse(
        items=items, page=page, page_size=page_size, total=total, pages=pages
    )


@router.get("/{entry_id}", response_model=WatchlistResponse)
def get_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific watchlist entry."""
    return watchlist_svc.get_entry(db, entry_id)


@router.patch("/{entry_id}", response_model=WatchlistResponse)
def update_entry(
    entry_id: str,
    data: WatchlistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin only: Update a watchlist entry."""
    return watchlist_svc.update_entry(db, entry_id, data, current_user.id)


@router.delete("/{entry_id}", response_model=WatchlistResponse)
def deactivate_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin only: Soft delete (deactivate) a watchlist entry."""
    return watchlist_svc.deactivate_entry(db, entry_id, current_user.id)


@router.post("/import", response_model=WatchlistImportResult)
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin only: Import watchlist entries from a CSV file."""
    content = await file.read()
    return watchlist_svc.import_csv(db, content, current_user.id)


@router.post("/seed", response_model=dict)
def seed_watchlist_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin only: Seed deterministic demo watchlist data."""
    return watchlist_svc.seed_watchlist(db)
