from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.audit import AuditLog
from app.core.security import require_role

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/")
def get_audit_logs(
    skip: int = Query(0, ge=0), 
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    _ = Depends(require_role(["ADMIN"]))
):
    total = db.query(AuditLog).count()
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "logs": logs
    }
