# API Contract

This document outlines the exposed REST API routes available in the FastAPI backend. Full OpenAPI interactive documentation is available by running the application and navigating to `http://localhost:8000/docs`.

## Authentication
- `POST /auth/login`
  - Purpose: Validates credentials and returns JWT Access and Refresh tokens.
  - Role: ANY
- `POST /auth/refresh`
  - Purpose: Exchanges a valid refresh token for a new token pair.
  - Role: ANY
- `POST /auth/logout`
  - Purpose: Puts the current JWT token on the Redis Deny-List.
  - Role: ANY
- `GET /auth/me`
  - Purpose: Returns the currently authenticated user details.
  - Role: ANY

## Cameras
- `GET /api/v1/cameras/`
  - Purpose: Returns paginated list of cameras, optionally filtered by status.
  - Role: VIEWER
- `POST /api/v1/cameras/`
  - Purpose: Creates a new camera entry.
  - Role: ADMIN
- `PUT /api/v1/cameras/{id}`
  - Purpose: Updates a camera's name, coordinates, or credentials.
  - Role: ADMIN
- `GET /api/v1/cameras/{id}/playback`
  - Purpose: Generates a signed, short-lived playback token for secure video access.
  - Role: VIEWER

## Health
- `POST /api/v1/health/heartbeat`
  - Purpose: Camera edge node reports metrics (fps, latency).
  - Auth: Authenticated Edge Device

## Events
- `POST /api/v1/events/`
  - Purpose: Ingest an AI metadata payload.
  - Auth: Edge `X-Analytics-Key` header.
- `GET /api/v1/events/`
  - Purpose: Retrieve paginated historical events.
  - Role: VIEWER

## Watchlist
- `GET /api/v1/watchlist/`
  - Purpose: Retrieve active target plates.
  - Role: VIEWER
- `POST /api/v1/watchlist/`
  - Purpose: Create a new watchlist entry.
  - Role: ADMIN
- `POST /api/v1/watchlist/import`
  - Purpose: Batch import plates via CSV.
  - Role: ADMIN

## Alerts
- `GET /api/v1/alerts/`
  - Purpose: List generated alerts.
  - Role: VIEWER
- `POST /api/v1/alerts/{alert_id}/action`
  - Purpose: Transition alert status (`ACKNOWLEDGE`, `RESOLVE`).
  - Role: OPERATOR

## Statistics & Dashboard
- `GET /api/v1/stats/overview`
  - Purpose: Fetch aggregate counts for dashboard charts.
  - Role: VIEWER

## Entity Search & Trace
- `GET /api/v1/search/entities`
  - Purpose: Execute a wildcard search against `vehicle_number`.
  - Role: VIEWER
- `GET /api/v1/trace/vehicle/{vehicle_number}`
  - Purpose: Return chronological sequence of camera sightings for polyline mapping.
  - Role: VIEWER

## Export
- `GET /api/v1/export/events` & `GET /api/v1/export/alerts`
  - Purpose: Export historical tabular data as `.csv`.
  - Role: OPERATOR

## Audit
- `GET /audit/`
  - Purpose: Return immutable administrative action logs.
  - Role: ADMIN

## WebSocket
- `WS /ws`
  - Purpose: Subscribe to real-time events, alerts, and health transitions.
  - Auth: Valid JWT token query parameter.
