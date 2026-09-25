import logging
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
    
    db.commit()
    db.close()

if __name__ == "__main__":
    logger.info("Initializing database with demo users")
    init_db()
    logger.info("Demo users initialized")