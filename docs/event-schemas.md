# Event Schemas

This document defines the standardized JSON schemas used for AI Edge ingestion and real-time WebSocket delivery.

## Edge Ingestion Schema (POST /api/v1/events/)

When the analytics simulator (or future edge inference engine) detects a vehicle, it posts the following payload:

```json
{
  "event_id": "uuid-v4-string",
  "camera_id": "C001",
  "timestamp": "2024-03-24T12:00:00Z",
  "event_type": "ANPR",
  "vehicle_number": "MH01AB1234",
  "vehicle_type": "SUV",
  "confidence": 0.98,
  "bounding_box": {
    "x": 100,
    "y": 150,
    "w": 200,
    "h": 50
  },
  "image_ref": "s3://bucket/image.jpg",
  "metadata": {
    "color": "black",
    "speed": "45"
  }
}
```

### Normalization and Deduplication
- `vehicle_number` is automatically stripped of whitespaces and converted to UPPERCASE to facilitate robust watchlist matching.
- **Idempotency**: The backend temporarily caches `{camera_id}:{vehicle_number}` in Redis. If the same plate is read on the same camera within a configured window (e.g., 5 seconds), subsequent events are silently dropped as duplicates to prevent database and UI spam.

## Real-Time WebSocket Envelope

Data pushed to the browser over the WebSocket channel utilizes an envelope structure allowing the frontend to distinguish payload types.

```json
{
  "type": "NEW_ALERT",
  "payload": {
    "id": "uuid",
    "status": "NEW",
    "event": {
      "camera_id": "C001",
      "vehicle_number": "MH01AB1234",
      "timestamp": "2024-03-24T12:00:00Z"
    }
  }
}
```

### Envelope Types:
- `NEW_EVENT`: Fired on every distinct AI event ingested.
- `NEW_ALERT`: Fired when an event explicitly matches the Watchlist AND is not subject to a cooldown period.
- `CAMERA_HEALTH`: Fired when a camera transitions state (e.g. `ONLINE` to `DEGRADED`).
