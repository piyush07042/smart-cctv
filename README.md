# okdriver-cctv-platform

## Project Purpose
Centralized CCTV monitoring and video analytics platform for the okDriver Full Stack challenge.

## Architecture Summary
The system uses a 7-layer architecture for ingestion, AI mock analytics, real-time message brokering, and web-based video visualization.

## Technology Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis
- **Video:** MediaMTX (WebRTC/HLS)

## Current Phase
Phase 7: AI Analytics Events + Watchlist + Matching + Alerts.
The backend handles edge camera event ingestion, deduplication, and exact watchlist matching to generate cooldown-protected Alerts.
The React frontend provides the Events log, Watchlist management (with CSV import), and Alert lifecycle workflow (Acknowledge, Resolve, Mark False Positive).

### Analytics Architecture
- **Ingestion:** Edge cameras use `X-Analytics-Key` to POST events securely.
- **Idempotency:** Redis guarantees exactly-once processing using `event_id`.
- **Deduplication:** A cooldown window prevents alert flooding per vehicle/camera combination.
- **Watchlist & Matching:** Supports CRUD + CSV import. Identifiers are normalized and cross-referenced with incoming metadata.
- **Alert Lifecycle:** Operational views transition alerts through `new -> acknowledged -> resolved` using RBAC constraints, leaving a full audit trail.
- **Frontend Workflow:** The Phase 7 frontend UI connects via REST APIs (polling/manual refresh).

*Note: WebSocket live browser updates for new events and alerts are deferred to Phase 8.*

## Prerequisites
- Docker & Docker Compose

## Setup Instructions
1. Copy the environment file: `cp .env.example .env`
2. Run the application: `docker compose up --build`
3. The database migrations and demo seed will run automatically.

### Running the Camera Seed Script
To populate the database with test cameras (after starting Docker and running migrations):
```bash
docker compose exec backend python -m app.seed_cameras
```

## Service URLs
- **Frontend:** http://localhost:5173
- **Backend API & Swagger:** http://localhost:8000/docs
- **MediaMTX:** http://localhost:8888 (API)

## Demo Credentials
- Admin: `admin` / `adminpass`
- Operator: `operator` / `operatorpass`
- Viewer: `viewer` / `viewerpass`

## Current Limitations
- WebSockets for real-time live events and alerts are deferred to Phase 8.
- Operations dashboard and vehicle tracing are Phase 9 features.\n