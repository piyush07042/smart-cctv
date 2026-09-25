"""
Pydantic schemas for Watchlist — Phase 7.
"""
import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.schemas.events import normalize_plate

VALID_ENTITY_TYPES = {"vehicle", "person", "other"}
VALID_CATEGORIES = {"stolen", "blacklisted", "wanted", "missing"}
VALID_SEVERITIES = {"low", "medium", "high", "critical"}


class WatchlistCreate(BaseModel):
    entity_type: str = Field("vehicle", description="vehicle | person | other")
    identifier: str = Field(..., max_length=64, description="Normalized plate or person ID")
    category: str = Field(..., description="stolen | blacklisted | wanted | missing")
    severity: str = Field("medium", description="low | medium | high | critical")
    description: Optional[str] = None
    reference_case_no: Optional[str] = Field(None, max_length=128)
    added_by: Optional[str] = Field(None, max_length=128)
    expires_at: Optional[datetime] = None
    is_active: bool = True

    def model_post_init(self, __context: Any) -> None:
        if self.entity_type not in VALID_ENTITY_TYPES:
            raise ValueError(f"entity_type must be one of {VALID_ENTITY_TYPES}")
        if self.category not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {VALID_CATEGORIES}")
        if self.severity not in VALID_SEVERITIES:
            raise ValueError(f"severity must be one of {VALID_SEVERITIES}")
        # Normalize vehicle identifiers
        if self.entity_type == "vehicle":
            self.identifier = normalize_plate(self.identifier)


class WatchlistUpdate(BaseModel):
    entity_type: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    reference_case_no: Optional[str] = None
    added_by: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class WatchlistResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    entity_type: Optional[str]
    identifier: str
    category: str
    severity: Optional[str]
    description: Optional[str]
    reference_case_no: Optional[str]
    added_by: Optional[str]
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class WatchlistListResponse(BaseModel):
    items: list[WatchlistResponse]
    page: int
    page_size: int
    total: int
    pages: int


class WatchlistImportResult(BaseModel):
    created: int
    updated: int
    skipped: int
    errors: list[dict[str, Any]]
