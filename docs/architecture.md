# Architecture

This document describes the architectural layout and data flow of the OKDriver CCTV Platform.

## 1. System Overview
The OKDriver CCTV Platform is a 3-tier web application built to ingest, store, and act on intelligent video analytics metadata while serving live and recorded video streams securely. It connects edge inference systems (represented in demo environments by the Analytics Simulator) to operators through a real-time reactive dashboard.

## 2. Logical Architecture
- **Frontend**: A React SPA running in the browser utilizing Vite, Zustand, and React Router. It securely polls REST API boundaries for historical state and listens on a WSS (WebSocket Secure) channel for real-time reactivity.
- **Backend**: A horizontal fleet of FastAPI workers handling HTTP requests, business logic validations, and WebSocket lifecycle management.
- **Database (PostgreSQL)**: The source of truth for persistent entities (Users, Cameras, Watchlists, Events, Alerts, Audit Logs).
- **In-Memory Store (Redis)**: Orchestrates distributed states, specifically Rate Limiting metrics, JWT Revocation Deny-Lists, and internal Pub/Sub messaging for real-time WebSockets.
- **Media Server (MediaMTX)**: Proxies RTSP and HLS streams.

## 3. Component Responsibilities
- **API Gateway (NGINX)**: Terminates TLS, proxies standard HTTP to FastAPI, proxies WS upgrades, and maps `/live` to MediaMTX.
- **Auth Middleware**: Intercepts requests, decodes JWTs, checks the Redis Deny-List, and enforces strict RBAC scopes based on route annotations.
- **Event Processor**: Receives POST payloads from analytics engines, normalizes properties (like plate casing), suppresses spam duplicates using an idempotency window, checks the Watchlist, and inserts records into PostgreSQL.
- **Alert Engine**: Subscribes to positive Watchlist matches. Determines if a target is on cooldown. If not, generates an actionable `Alert` entity.
- **Real-Time Gateway**: Receives signals from the Event Processor and Alert Engine via Redis Pub/Sub, wraps them in a standardized schema, and pushes them to authenticated WebSocket clients.

## 4. Data Flow
1. Edge Analytics POSTs to `/api/v1/events/`.
2. Backend intercepts, verifies `X-Analytics-Key`.
3. Event is validated and stored in PostgreSQL.
4. An internal Redis Pub/Sub message broadcasts the event.
5. All connected, authorized WebSocket clients receive the payload.

## 5. Video Flow
1. Operator requests playback token via `/api/v1/cameras/{id}/playback`.
2. Backend validates operator role and generates short-lived signed JWT.
3. Operator's browser attempts to connect to MediaMTX with the token.
4. (Simulated) MediaMTX serves the proxy stream directly.

## 6. Analytics Flow
Edge Inference -> Event Schema Normalization -> Idempotency Filter -> Watchlist Evaluator -> Storage & Alert Generation.

## 7. Alert Flow
1. Event matches active Watchlist ID.
2. Alert Engine verifies cooldown window.
3. Alert is created as `NEW`.
4. Push to WebSockets.
5. Operator explicitly clicks `Acknowledge`.
6. Operator explicitly resolves as `RESOLVED` or `FALSE_POSITIVE`.
7. Every state transition is written to Audit Logs.

## 8. Real-Time Flow
```text
[Event Engine] --(Publish)--> [Redis] --(Subscribe)--> [WebSocket Worker] --(WSS)--> [React Client]
```

## 9. Health Monitoring Flow
1. Camera issues periodic heartbeats to `/api/v1/health/heartbeat`.
2. Backend updates `last_heartbeat` and verifies FPS/Latency thresholds.
3. If valid -> `ONLINE`.
4. If missing optional metrics -> `DEGRADED`.
5. Background task scans `last_heartbeat`. If `current_time - last_heartbeat > threshold` -> `OFFLINE`.

## 10. Security Boundaries
- Edge to Gateway: Required TLS.
- Gateway to Backend: Internal Docker Network.
- User to Gateway: Required TLS, validated JWT.
- Tokens: Stored purely in-memory in Frontend, rotated periodically.

## 11. Persistence
PostgreSQL leverages SQLAlchemy ORM mapping. Critical indexes are established on Event Timestamps, Alert Statuses, and Watchlist plates for efficient search query boundaries.

## 12. Scalability Evolution
See [Scalability](scalability.md) for future evolutions.
