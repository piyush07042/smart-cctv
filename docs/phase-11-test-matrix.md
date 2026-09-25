# Phase 11 Test Matrix

| Area | Test | Expected Result | Automated | Manual | Status |
|---|---|---|---|---|---|
| Auth | Login with valid credentials | 200 OK, returns access & refresh tokens | Yes | Yes | PASS |
| Auth | Login with invalid credentials | 401 Unauthorized | Yes | Yes | PASS |
| Auth | Refresh token rotation | 200 OK, issues new pair, revokes old refresh | Yes | Yes | PASS |
| Auth | Logout revocation | Active token placed on Redis deny-list | Yes | Yes | PASS |
| RBAC | Admin mutation attempts | 200/201 Success | Yes | Yes | PASS |
| RBAC | Operator mutation attempts | 403 Forbidden for restricted areas (e.g. users, audit) | Yes | Yes | PASS |
| RBAC | Viewer mutation attempts | 403 Forbidden for all mutations | Yes | Yes | PASS |
| Camera Registry | Create new camera | 201 Created | Yes | Yes | PASS |
| Camera Registry | Update camera credentials | Encrypted at rest, never returned in API | Yes | Yes | PASS |
| Camera Health | Health transition (Online -> Offline) | DB state updated, event published via Redis | Yes | Yes | PASS |
| Video | Generate playback token | Signed JWT returned, scoped to camera | Yes | Yes | PASS |
| Video | Verify stream rendering | Streams load in frontend (RTSP synthetic/HLS) | No | Yes | PASS |
| Events | Ingest valid ANPR event | 201 Created, pushed to real-time | Yes | Yes | PASS |
| Deduplication | Ingest duplicate ANPR event | 200 OK (Ignored duplicate), no real-time spam | Yes | Yes | PASS |
| Watchlist | Import CSV watchlist | Batch entries created | Yes | Yes | PASS |
| Watchlist | Match event to watchlist | Alert generated automatically | Yes | Yes | PASS |
| Alerts | Acknowledge/Resolve Alert | Status updated, Audit log generated | Yes | Yes | PASS |
| WebSocket | Real-time WebSocket connection | Connects via JWT, receives broadcast events | Yes | Yes | PASS |
| Dashboard | Aggregate metrics | Accurate counts of cameras, alerts, events | Yes | Yes | PASS |
| Search | Filter entities | Returns paginated exact/partial matches | Yes | Yes | PASS |
| Vehicle Trace | Generate trace | Maps sequential sightings across cameras | Yes | Yes | PASS |
| CSV Export | Export filtered events/alerts | CSV returned with proper headers | Yes | Yes | PASS |
| Audit | Central Audit Log Generation | Immutable log entry created for actions | Yes | Yes | PASS |
| Audit | Admin Audit Viewer API | 200 OK paginated logs | Yes | Yes | PASS |
| Security | Secret scanning | No secrets found in tree | Yes | Yes | PASS |
| Database migrations | Alembic from clean DB | Clean upgrade to head | Yes | No | PASS |
| Docker | Startup via compose | All containers healthy | No | Yes | PASS |
| Frontend | Production build | Clean build | No | Yes | PASS |
| Error handling | Invalid/missing inputs | 422 Unprocessable Entity with clear details | Yes | Yes | PASS |
