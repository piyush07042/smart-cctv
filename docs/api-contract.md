# API Contract

## AUTH

### `POST /auth/login`
- **Purpose**: Authenticate user and receive JWT.
- **Auth**: None
- **Role**: None
- **Request Body**: `{"username": "...", "password": "..."}`
- **Response**: `{"access_token": "...", "token_type": "bearer"}`
- **Status Codes**: 200 OK, 401 Unauthorized

### `GET /auth/me`
- **Purpose**: Get current user details.
- **Auth**: Required
- **Role**: Any
- **Response**: User object (id, username, role)
- **Status Codes**: 200 OK, 401 Unauthorized

## CAMERAS

### `POST /cameras`
- **Purpose**: Register a new camera.
- **Auth**: Required
- **Role**: Admin
- **Request Body**: Camera details (name, location, stream URL, etc.)
- **Response**: Created camera object
- **Status Codes**: 201 Created, 400 Bad Request

### `GET /cameras`
- **Purpose**: List all cameras (with optional filtering).
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: List of camera objects
- **Status Codes**: 200 OK

### `GET /cameras/{id}`
- **Purpose**: Get specific camera details.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: Camera object
- **Status Codes**: 200 OK, 404 Not Found

### `PATCH /cameras/{id}`
- **Purpose**: Update camera configuration.
- **Auth**: Required
- **Role**: Admin
- **Request Body**: Partial camera fields
- **Response**: Updated camera object
- **Status Codes**: 200 OK, 404 Not Found

### `POST /cameras/{id}/disable`
- **Purpose**: Disable a camera.
- **Auth**: Required
- **Role**: Admin
- **Response**: `{"status": "disabled"}`
- **Status Codes**: 200 OK

### `POST /cameras/{id}/enable`
- **Purpose**: Enable a camera.
- **Auth**: Required
- **Role**: Admin
- **Response**: `{"status": "enabled"}`
- **Status Codes**: 200 OK

### `GET /cameras/{id}/audit`
- **Purpose**: Get audit logs for a specific camera.
- **Auth**: Required
- **Role**: Admin
- **Response**: List of audit logs
- **Status Codes**: 200 OK

### `GET /cameras/{id}/playback`
- **Purpose**: Get secure token/URL for stream playback (HLS/WebRTC).
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: `{"playback_url": "..."}`
- **Status Codes**: 200 OK

### `POST /cameras/{id}/heartbeat`
- **Purpose**: Receive heartbeat from a camera or adapter.
- **Auth**: Required (Service/Adapter token)
- **Role**: System
- **Request Body**: `{"status": "online/offline", "timestamp": "..."}`
- **Response**: `{"acknowledged": true}`
- **Status Codes**: 200 OK

## EVENTS

### `POST /events`
- **Purpose**: Receive a single detection event.
- **Auth**: Required (Service token)
- **Role**: System
- **Request Body**: Detection event schema
- **Response**: `{"event_id": "..."}`
- **Status Codes**: 201 Created, 409 Conflict (Duplicate)

### `POST /events/batch`
- **Purpose**: Receive multiple detection events.
- **Auth**: Required (Service token)
- **Role**: System
- **Request Body**: List of detection events
- **Response**: `{"processed": N, "duplicates": M}`
- **Status Codes**: 200 OK

### `GET /events`
- **Purpose**: List historical events with filtering.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: List of events with pagination
- **Status Codes**: 200 OK

## WATCHLIST

### `GET /watchlist`
- **Purpose**: List watchlist entries.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: List of watchlist objects
- **Status Codes**: 200 OK

### `POST /watchlist`
- **Purpose**: Add entry to watchlist.
- **Auth**: Required
- **Role**: Admin
- **Request Body**: Watchlist details (identifier, category, etc.)
- **Response**: Created entry
- **Status Codes**: 201 Created

### `PATCH /watchlist/{id}`
- **Purpose**: Update watchlist entry.
- **Auth**: Required
- **Role**: Admin
- **Request Body**: Partial updates
- **Response**: Updated entry
- **Status Codes**: 200 OK

### `DELETE /watchlist/{id}`
- **Purpose**: Remove watchlist entry.
- **Auth**: Required
- **Role**: Admin
- **Response**: `{"status": "deleted"}`
- **Status Codes**: 204 No Content

### `POST /watchlist/import`
- **Purpose**: Bulk import watchlist entries.
- **Auth**: Required
- **Role**: Admin
- **Request Body**: CSV or JSON array
- **Response**: `{"imported": N}`
- **Status Codes**: 200 OK

## ALERTS

### `GET /alerts`
- **Purpose**: List alerts.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: List of alerts
- **Status Codes**: 200 OK

### `GET /alerts/{id}`
- **Purpose**: Get specific alert details.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: Alert object
- **Status Codes**: 200 OK

### `POST /alerts/{id}/acknowledge`
- **Purpose**: Mark alert as acknowledged.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: Updated alert
- **Status Codes**: 200 OK

### `POST /alerts/{id}/resolve`
- **Purpose**: Mark alert as resolved.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: Updated alert
- **Status Codes**: 200 OK

### `POST /alerts/{id}/false-positive`
- **Purpose**: Mark alert as false positive.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: Updated alert
- **Status Codes**: 200 OK

## ENTITY / VEHICLE SEARCH

### `GET /entities/vehicles/{plate}/trace`
- **Purpose**: Get geographic and chronological trace of a vehicle.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: List of events/coordinates sorted by time
- **Status Codes**: 200 OK

### `GET /search?q=`
- **Purpose**: Global search (cameras, vehicles, alerts).
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: Mixed search results
- **Status Codes**: 200 OK

## STATISTICS

### `GET /stats/overview`
- **Purpose**: Get dashboard statistics.
- **Auth**: Required
- **Role**: Operator/Admin
- **Response**: Counts of active cameras, alerts today, etc.
- **Status Codes**: 200 OK

## AUDIT

### `GET /audit-logs`
- **Purpose**: List system audit logs.
- **Auth**: Required
- **Role**: Admin
- **Response**: List of audit entries
- **Status Codes**: 200 OK

## SYSTEM

### `GET /health`
- **Purpose**: Basic API health check.
- **Auth**: None
- **Response**: `{"status": "ok"}`
- **Status Codes**: 200 OK

### `GET /metrics`
- **Purpose**: Prometheus metrics.
- **Auth**: None (or internal only)
- **Response**: Text metrics
- **Status Codes**: 200 OK

## REAL-TIME

### `WS /ws`
- **Purpose**: Connect to WebSocket for real-time updates.
- **Auth**: Token provided in connection URL or initial message.
- **Role**: Operator/Admin
- **Events**: Receives alerts, camera health, and live detections.
