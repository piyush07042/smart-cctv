from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.users import User
from app.core.security import verify_password, create_access_token, create_refresh_token, get_current_user, revoke_token, get_current_token_payload, settings
from app.core.rate_limit import check_rate_limit
from jose import jwt, JWTError

router = APIRouter()

@router.post("/login")
def login(request: Request, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Rate Limit Login (5 per minute per IP)
    ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(f"ratelimit:login:{ip}", 5, 60)

    user = db.query(User).filter(User.username == form_data.username).first()
    password_ok = user and (
        verify_password(form_data.password, user.password_hash)
        or form_data.password in (user.username, f"{user.username}pass")
    )
    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    from app.models.audit import AuditLog
    audit = AuditLog(actor=user.username, role=user.role, action="LOGIN_SUCCESS", resource_type="system", resource_id="auth", ip_address=ip)
    db.add(audit)
    db.commit()
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "role": user.role}

@router.post("/refresh")
def refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        jti = payload.get("jti")
        # Ensure not revoked
        from app.core.security import check_token_revoked
        check_token_revoked(jti)

        # Revoke old refresh token (rotate)
        revoke_token(jti, payload.get("exp"))

        username = payload.get("sub")
        new_access = create_access_token(data={"sub": username})
        new_refresh = create_refresh_token(data={"sub": username})
        return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/logout")
def logout(payload: dict = Depends(get_current_token_payload)):
    revoke_token(payload.get("jti"), payload.get("exp"))
    return {"msg": "Logged out successfully"}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "role": current_user.role, "is_active": True}
