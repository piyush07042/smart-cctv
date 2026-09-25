# OKDriver CCTV Platform

## 1. Overview
The OKDriver CCTV Platform is a centralized monitoring and intelligent video analytics platform. It bridges the gap between disparate camera networks and modern AI-driven actionable intelligence. 

The platform supports:
- **Camera Registry**: Manage fleets of cameras with encrypted credentials.
- **Live/Near-Live Video**: Playback live RTSP and HLS video streams securely.
- **Camera Health**: Monitor uptime, latency, frame rates, and automatic degradation/offline status.
- **AI Event Ingestion**: A standardized POST endpoint for ingesting edge AI metadata (such as ANPR).
- **Watchlists**: Maintain active target plates with CSV import functionality.
- **Alerts**: Automated alert generation and lifecycle management (acknowledge/resolve) for positive watchlist matches.
- **Real-Time Operations**: Receive instant, sub-second event and health updates via WebSocket push architecture.
- **GIS Visualization**: Leaflet-based dynamic maps displaying cameras and live events.
- **Vehicle/Entity Search**: Instantly query historical events.
- **Movement Trace**: Reconstruct sequential sightings of vehicles across geographical nodes.
- **Audit Logging**: Immutable action trails for administrative review.
- **Security Controls**: Role-Based Access Control (RBAC), JWT token rotation, and robust brute-force protection.

*Note: The current demo environment uses an analytics simulator for AI event generation rather than production AI model inference. The architecture accepts standardized payloads, allowing seamless replacement with real edge analytics.*

## 2. Problem
Traditional CCTV networks suffer from fragmented operational visibility. Challenges include:
- **Fragmented Monitoring**: Inability to view streams, events, and health in a single pane.
- **Blind Health Visibility**: Cameras silently dropping offline with no proactive monitoring.
- **Inefficient Event Management**: Difficulty querying historical occurrences.
- **Manual Vehicle Identification**: Reliance on manual review instead of automated ANPR watchlist matching.
- **Delayed Alert Response**: Polling-based architectures causing delays in critical notifications.

## 3. Key Features
- **Secure Authentication & RBAC**: Admin, Operator, and Viewer roles with granular capabilities.
- **Real-time Engine**: Redis Pub/Sub powered WebSocket delivery for instantaneous UI updates without polling.
- **Analytics Ingestion API**: Idempotent deduplication windows rejecting repetitive duplicate events.
- **Watchlist & Alert Management**: Exact matching mapped to alerting workflows with cooldown suppression.
- **Interactive Dashboard**: Aggregated operational metrics, GIS mapping, and live event ticker.
- **Forensic Trace**: Chronological vehicle tracking across multiple geographical nodes.

## 4. Architecture
See [Architecture Documentation](docs/architecture.md) for full details.

The platform utilizes a modern 3-tier architecture:
- **Frontend Layer**: React + Vite + Zustand state management with real-time UI binding.
- **Backend Layer**: FastAPI powered REST API + WebSocket Gateway.
- **Data & Pub/Sub Layer**: PostgreSQL for persistent relationships and Redis for ephemeral rate-limiting, token revocation, and real-time Pub/Sub brokering.

## 5. Technology Stack
- **Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic, Python 3.10+
- **Frontend**: React 18, Vite, TailwindCSS (utility via merged components), Lucide React, Recharts, Leaflet
- **Database**: PostgreSQL
- **In-Memory & Real-time**: Redis
- **Media**: MediaMTX (RTSP/WebRTC)
- **Deployment**: Docker, Docker Compose, NGINX

## 6. Repository Structure
```text
backend/           # FastAPI application, SQLAlchemy models, API routes
frontend/          # React Vite application, Zustand stores, UI components
docs/              # Architectural, ERD, and API documentation
simulator/         # Synthetic event payload generator for analytics emulation
nginx/             # Reverse proxy and TLS termination configuration
```

## 7. Quick Start
### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.10+ (for local backend development)

### Environment Setup
Copy the example environment files:
```bash
cp .env.example .env
```

### Docker Startup
Launch the full stack locally:
```bash
docker compose up -d
```
The stack provisions PostgreSQL, Redis, the Backend, Frontend, and MediaMTX.

### Migrations
The database schema applies automatically on container startup. To apply manually:
```bash
cd backend
alembic upgrade head
```

### Seed Data
The application comes pre-seeded with test accounts, a default watchlist, and standard demo cameras.

## 8. Demo Credentials
These credentials are for the **development/demo environment only**:
- **Admin**: `testadmin` / `testpass` (Full read/write/audit access)
- **Operator**: `testoperator` / `operpass` (Read/write access, no audit/user mutation)
- **Viewer**: `testviewer` / `viewpass` (Read-only access)

## 9. Demo Walkthrough
1. **Login**: Authenticate as `testadmin` at `http://localhost`.
2. **Open Dashboard**: View aggregate operational metrics.
3. **Show Camera Health**: Navigate to cameras and see the mock stream capabilities and health status.
4. **Show Live Camera**: Click on a camera to execute a secure RTSP/HLS stream via signed playback token.
5. **Open Map**: Observe the GIS clustered map.
6. **Show Events**: Access the events list.
7. **Show Watchlist**: Navigate to the watchlist and view pre-seeded targets.
8. **Trigger Watchlist Event**: (Using the simulator) Generate an event matching a target plate.
9. **Show Alert**: Observe the real-time alert trigger via WebSocket.
10. **Acknowledge/Resolve Alert**: Advance the alert lifecycle state.
11. **Search Vehicle**: Execute an entity search for the targeted license plate.
12. **Open Movement Trace**: Visualize the route of the vehicle chronologically.
13. **Open Audit**: View the centralized audit trail recording your administrative actions.

## 10. AI Analytics
The current demo employs a synthetic **Analytics Simulator** that systematically pushes `POST /events/` payloads. It correctly exercises the backend's validation, persistence, deduplication, watchlist matching, and real-time push boundaries.

**Note**: A real production ANPR/YOLO model is not included in this repository.

## 11. Video Sources
- **MediaMTX**: Proxies RTSP and HLS streams.
- **Mock Adapters**: Synthetic streams used for stable demonstration purposes.

## 12. Camera Health
The backend heartbeat processor interprets the following statuses:
- **ONLINE**: Valid latency and FPS.
- **DEGRADED**: Missing optimal metrics (e.g., high packet loss or low FPS).
- **OFFLINE**: Consecutive missed heartbeats exceeding the configured hysteresis threshold.

## 13. Watchlist + Alert Flow
An ingested AI event provides a vehicle license plate. The plate is normalized (spaces stripped, upper-cased) and strictly matched against active watchlist entries. A match creates an `Alert` and suppresses immediate duplicate alerts based on the configured cooldown window.

## 14. Real-Time Architecture
**Flow**: `Application POST` → `Redis Pub/Sub` → `WebSocket Gateway` → `Browser State`

Redis Pub/Sub securely brokers internal messages between FastAPI worker processes, dispatching authenticated payloads out over connected WSS sockets.

## 15. Security
See [Security Documentation](docs/security.md).
- **Tokens**: Short-lived JWT Access Tokens alongside rotating Refresh Tokens.
- **Revocation**: Redis-backed deny-list ensuring instantaneous logout invalidation.
- **Protection**: Brute-force rate limiting, strict CORS, and backend SSRF boundaries.

## 16. Testing
See [Testing Strategy](docs/testing.md).
- **Backend**: 109/109 regression tests strictly validating isolated unittests alongside MockRedis test adapters.
- **Frontend**: Standard Vite build validations. Note that due to external upstream dependency variations (e.g., recharts/react-is), strict Typechecking may bypass Rollup definitions locally.

## 17. API Documentation
The OpenAPI/Swagger UI is exposed natively by FastAPI.
Visit `http://localhost:8000/docs` while the backend is running.

## 18. Scalability
See [Scalability Documentation](docs/scalability.md) for detailed future architectural patterns aiming toward 80,000+ camera networks using Regional Gateways and Durable Event Streams.

## 19. Deployment
Standard docker-compose alongside TLS configurations (`docker-compose.tls.yml`). The current configuration is optimized for localized demonstration and integration testing, not immediate global production deployment.

## 20. Current Limitations
- **Analytics Simulator**: AI processing is simulated natively; it requires integration with an external inference API.
- **Video Sources**: Streams rely on MediaMTX synthetics or localized RTSP targets instead of enterprise ONVIF discovery protocols.
- **Real-Time Subsystem**: Redis Pub/Sub does not support durable consumer replay natively. Missed web socket deliveries require manual REST polling to catch up.

## 21. Future Evolution
- Integration with GPU inference clusters.
- Shift from Redis Pub/Sub to Kafka / Redpanda for durable event streaming.
- Auto-discovery protocols (ONVIF).
- Sharded PostgreSQL deployments with specialized time-series indexing.