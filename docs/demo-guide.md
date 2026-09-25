# Demo Guide

This guide is for technical reviewers, judges, or operators who need to validate the platform’s end-to-end functionality.

## Startup
Ensure Docker is running, then execute:
```bash
docker compose up -d
```
The application will automatically apply database migrations and seed deterministic demo data.

Navigate to: `http://localhost`

## Login
Use the pre-seeded admin credentials:
- **Username**: `testadmin`
- **Password**: `testpass`

## 1. Dashboard
Navigate to the root dashboard (`/`).
- **What to show**: The top cards will display total cameras, total active alerts, and total logged events for the day. 

## 2. Camera Registry & Health
Navigate to the `Cameras` tab.
- **What to show**: A list of seeded cameras (e.g., `C001`, `C002`). You can view their status. By default, cameras missing heartbeats will degrade to `OFFLINE`. The analytics simulator script can be run to simulate healthy metrics.

## 3. Video Streaming
Click the `Play` icon on a camera row.
- **What to show**: The video dialog opens, the browser fetches a signed JWT playback token, and connects to the MediaMTX proxy to render the stream.

## 4. AI Event Ingestion & Watchlist Matching
The database is seeded with a target plate: `GJ01XX0001`.
- **What to show**: Execute the Analytics Simulator to generate a deterministic event:
```bash
docker exec -it cctv-backend python simulator/run.py
```
*(Alternatively, execute a raw cURL `POST /api/v1/events/` matching that plate).*

## 5. Real-Time Alert
Stay on the Dashboard or Alerts page without refreshing.
- **What to show**: The moment the event is ingested, a `NEW_ALERT` is pushed via WebSockets. A toast notification will appear and the alert will automatically populate the data tables.

## 6. Alert Lifecycle
Navigate to the `Alerts` tab.
- **What to show**: Click on the new alert. Use the dropdown to select `Acknowledge`, then `Resolve`. This demonstrates the operational response flow.

## 7. Vehicle Trace
Navigate to the `Search -> Vehicle Trace` tab.
- **What to show**: Enter the tracked plate (`GJ01XX0001`). The system will generate a chronological polyline on the Leaflet map connecting the camera nodes where the vehicle was spotted.

## 8. Audit Trail & Security
Navigate to the `Audit Logs` tab.
- **What to show**: The table clearly lists your previous actions: `login`, `alert_acknowledge`, `alert_resolve`, establishing strict administrative accountability. 
- Log out, and attempt to log in as `testoperator` / `operpass`. Note that the `Audit Logs` tab is restricted via RBAC and will return a `403 Forbidden` if manually accessed.
