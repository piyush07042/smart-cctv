"""
Statistics API — Phase 9.
GET /stats/overview
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.services import stats as stats_svc

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns aggregated dashboard statistics.
    Camera counts, alert severities, event metrics, and top cameras.
    """
    return stats_svc.get_overview(db)
