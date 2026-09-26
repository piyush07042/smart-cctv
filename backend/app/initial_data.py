import logging
import sqlalchemy as sa
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.users import User
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    db = SessionLocal()
    users_to_create = [
        {"username": settings.DEMO_ADMIN_USERNAME, "password": settings.DEMO_ADMIN_PASSWORD, "role": "ADMIN"},
        {"username": settings.DEMO_OPERATOR_USERNAME, "password": settings.DEMO_OPERATOR_PASSWORD, "role": "OPERATOR"},
        {"username": settings.DEMO_VIEWER_USERNAME, "password": settings.DEMO_VIEWER_PASSWORD, "role": "VIEWER"}
    ]
    
    for u in users_to_create:
        user = db.query(User).filter(User.username == u["username"]).first()
        if not user:
            logger.info(f"Creating demo user {u['username']} with role {u['role']}")
            user = User(
                username=u["username"],
                password_hash=get_password_hash(u["password"]),
                role=u["role"],
                email=f"{u['username']}@example.com"
            )
            db.add(user)
        else:
            user.password_hash = get_password_hash(u["password"])
            db.add(user)
    
    db.commit()
    db.close()


def seed_watchlist():
    """Idempotent: seed demo watchlist entries using raw SQL.
    Uses raw SQL because identifier_type is a DB column added by migration
    that is not declared on the SQLAlchemy ORM model.
    """
    from app.core.database import engine

    DEMO_ENTRIES = [
        {
            "identifier": "GJ01XX0001",
            "identifier_type": "vehicle",
            "entity_type": "vehicle",
            "category": "blacklist",
            "severity": "critical",
            "description": "Known offender — blacklisted vehicle",
            "reference_case_no": "DEMO-001",
            "added_by": "demo-seed",
            "is_active": True,
        },
        {
            "identifier": "MH12AB1234",
            "identifier_type": "vehicle",
            "entity_type": "vehicle",
            "category": "stolen",
            "severity": "high",
            "description": "Reported stolen vehicle",
            "reference_case_no": "DEMO-002",
            "added_by": "demo-seed",
            "is_active": True,
        },
        {
            "identifier": "DL01CD5678",
            "identifier_type": "vehicle",
            "entity_type": "vehicle",
            "category": "stolen",
            "severity": "high",
            "description": "Reported stolen vehicle",
            "reference_case_no": "DEMO-003",
            "added_by": "demo-seed",
            "is_active": True,
        },
    ]

    created = 0
    skipped = 0
    with engine.connect() as conn:
        for entry in DEMO_ENTRIES:
            row = conn.execute(
                sa.text("SELECT id FROM watchlist_entries WHERE identifier = :ident"),
                {"ident": entry["identifier"]},
            ).fetchone()
            if row:
                skipped += 1
                continue
            conn.execute(
                sa.text("""
                    INSERT INTO watchlist_entries
                        (identifier, identifier_type, entity_type, category, severity,
                         description, reference_case_no, added_by, is_active)
                    VALUES
                        (:identifier, :identifier_type, :entity_type, :category, :severity,
                         :description, :reference_case_no, :added_by, :is_active)
                """),
                entry,
            )
            created += 1
        conn.commit()
    logger.info(f"Watchlist seed complete — created: {created}, already existed: {skipped}")


if __name__ == "__main__":
    logger.info("Initializing database with demo users")
    init_db()
    logger.info("Demo users initialized")
    
    logger.info("Initializing database with demo cameras")
    from app.seed_cameras import seed_cameras
    seed_cameras()
    logger.info("Demo cameras initialized")

    logger.info("Seeding watchlist entries")
    seed_watchlist()
    logger.info("Watchlist seeded")