# Phase 6: Camera Health Monitoring and Heartbeat Service

This document describes the camera health architecture for the okdriver-cctv-platform.

## 1. Concepts

The system models camera health via three states:
- `ONLINE`: Heartbeats are recent, and pull-mode sources are reachable. Health metrics (e.g. FPS, latency) are within acceptable thresholds.
- `DEGRADED`: The camera is reachable or pushing heartbeats, but metrics indicate poor quality (e.g., low FPS, high packet loss, or high latency).
- `OFFLINE`: No push heartbeats have been received in the required timeframe, OR the adapter explicitly reports the source as unreachable (pull mode).

## 2. Heartbeat Models

### Push Heartbeat
A REST endpoint `POST /cameras/{camera_id}/heartbeat` allows edge cameras, proxies, or simulators to actively report health.
**Authentication:** A shared `HEARTBEAT_API_KEY` prevents unauthorized status manipulation.
**Throttling/Publishing:** Push heartbeats immediately update `last_heartbeat` in the database, but do *not* emit a Redis event unless the status state shifts.

### Pull Health Checks
The `HealthMonitor` worker automatically queries enabled cameras via the `SourceAdapter` registry (`adapter.get_status()`).

## 3. Rules and Hysteresis
- **Online Rule**: Heartbeat < `30s` old or adapter responds OK. Metrics are normal.
- **Degraded Rule**: Configurable thresholds dictate degradation:
  - `FPS < 10`
  - `Latency > 1000ms`
  - `Packet Loss > 5%`
- **Offline Rule**: 
  - Time since last heartbeat > `60s`
  - Adapter returns OFFLINE.
- **Hysteresis**: An active camera requires `2 consecutive failures` to be marked OFFLINE. This is configured via `HEALTH_FAILURE_HYSTERESIS`. A transient failure does not flap the status.

## 4. Health History
State transitions (e.g. ONLINE -> DEGRADED, ONLINE -> OFFLINE) are recorded permanently in the `camera_health_events` table.
An endpoint `GET /cameras/{camera_id}/health` returns the historical timeline of these transitions.

## 5. Worker Implementation
The worker (`backend/app/workers/health_monitor.py`) runs every `10s` (`HEALTH_CHECK_INTERVAL_SECONDS`). It:
1. Evaluates all `enabled` cameras.
2. Checks push-based `last_heartbeat`.
3. Checks pull-based adapter status.
4. Determines new status based on thresholds and hysteresis.
5. If status changes, records an event and publishes to Redis.

*Limitation:* For local prototype development, the worker is spawned in the FastAPI `lifespan`. This works for single processes but must be decoupled if deploying multiple Uvicorn instances.

## 6. Redis Publication
A message is published to the `camera.health` channel ONLY upon transition.
```json
{
  "type": "camera.health",
  "version": 1,
  "timestamp": "2026-09-24T10:05:30Z",
  "payload": {
    "camera_id": "C002",
    "old": "ONLINE",
    "new": "OFFLINE",
    "at": "2026-09-24T10:05:30Z"
  }
}
```
If Redis is temporarily unavailable, publication fails gracefully (logged) without crashing the database state.

## 7. Failure Simulation
Use `simulator/health_simulator.py` to test transitions.
```bash
# Terminal 1: Normal
SIMULATOR_MODE=NORMAL python simulator/health_simulator.py

# Terminal 2: Degraded
SIMULATOR_MODE=DEGRADED python simulator/health_simulator.py

# Stop terminal to simulate OFFLINE.
```

## 8. Future Large-Scale Architecture (80,000 Cameras)
The current evaluation loops sequentially. To scale to 80,000 cameras:
- **Sharding:** Multiple decentralized health workers split the camera pool.
- **Message Broker / Partitioning:** Push heartbeats go into Kafka/RabbitMQ partitions rather than direct PostgreSQL UPDATE statements.
- **Edge Agents:** The camera/NVR layer handles ping checks directly and aggregates status.
- **Indexed Batches:** The background worker pulls cameras using bounded concurrency or `LIMIT/OFFSET`.
