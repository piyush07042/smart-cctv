# Security Architecture

## 1. Authentication & Token Lifecycle
- **Access Tokens**: Short-lived JWTs (default 30 mins) validated via `HS256` in `backend/app/core/security.py`.
- **Refresh Rotation**: *[Partially Implemented]* Refresh token mechanics are designed conceptually but require full DB state handling in Phase 11.
- **Logout Revocation**: *[Partially Implemented]* Redis deny-list architecture is pending full Redis session management integration.

## 2. RBAC Matrix
Roles (`ADMIN`, `OPERATOR`, `VIEWER`) are strictly enforced via the `require_role` FastAPI dependency. 
- `VIEWER`: Read-only map/live video.
- `OPERATOR`: Can trace and export, but cannot manage users/cameras.
- `ADMIN`: Full access to cameras, watchlists, alerts, and audit logs.

## 3. Network & Transport Security
- **Reverse Proxy**: NGINX configuration (`nginx/nginx.conf`) handles HTTP -> HTTPS redirects and terminates TLS.
- **WSS Verification**: WebSockets securely proxy through `/ws` with proper upgrade headers.
- **Security Headers**: HSTS, `X-Content-Type-Options`, and `Content-Security-Policy` are enforced at the ASGI middleware level and NGINX level.
- **CORS**: Strictened to allow only `$CORS_ORIGINS` loaded from environment variables (no wildcard `*`).

## 4. Input & Stream Validation
- **Pydantic Validation**: All POST/PUT requests use typed Pydantic models to reject excessive sizes and invalid types.
- **SSRF Allow-list**: Outbound probes to cameras use rigorous host checks to prevent internal network scanning.
- **Credentials at Rest**: Camera URLs containing passwords are encrypted via Fernet symmetric encryption.
- **Safe API Responses**: Passwords and decrypted RTSP URLs are stripped from API outputs (`has_credentials` flag returned instead).
- **Signed Playback**: RTSP proxies require short-lived access mechanisms.

## 5. Audit & Rate Limiting
- **Central Audit Log**: Records actor, role, action, and safe before/after JSON states. Admin-only read access.
- **Rate Limiting**: *[Pending]* Redis sliding-window implementation for brute-force protection to be hardened in Phase 11.

## 6. Secret Management
- `.env.example` contains safe placeholders.
- A simulated secret scan was executed, finding no leaked production keys.
- Production `JWT_SECRET` and `FERNET_KEY` are isolated service keys injected via CI/CD.

## Known Limitations
- Refresh token rotation and Redis deny-list are not completely functionally integrated into the frontend client.
- Rate limiting middleware is mocked but not aggressively blocking traffic to avoid breaking local demos.
