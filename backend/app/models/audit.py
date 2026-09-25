from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from app.models.base import Base
import uuid

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    actor = Column(String, index=True)
    role = Column(String)
    action = Column(String, index=True)
    resource_type = Column(String, index=True)
    resource_id = Column(String, index=True)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
