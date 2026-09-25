# Database Entity-Relationship Diagram

## Entities

### USERS
- id (PK)
- username
- email
- password_hash
- role
- is_active
- created_at
- updated_at

### CAMERAS
- id (PK)
- camera_id (Unique)
- name
- department
- latitude
- longitude
- camera_type
- source_protocol
- stream_endpoint_ref
- status
- last_heartbeat
- zone
- storage_metadata
- is_enabled
- created_at
- updated_at

### CAMERA_HEALTH
- id (PK)
- camera_id (FK -> CAMERAS.camera_id)
- status
- heartbeat_at
- latency_ms
- metadata
- created_at

### DETECTION_EVENTS
- id (PK)
- event_id (Unique)
- camera_id (FK -> CAMERAS.camera_id)
- timestamp
- event_type
- vehicle_number
- confidence
- vehicle_type
- bounding_box
- created_at

### WATCHLIST
- id (PK)
- identifier (Unique with type)
- identifier_type
- category
- description
- is_active
- created_at
- updated_at

### ALERTS
- id (PK)
- detection_id (FK -> DETECTION_EVENTS.id)
- camera_id (FK -> CAMERAS.camera_id)
- watchlist_id (FK -> WATCHLIST.id)
- severity
- status
- message
- created_at
- acknowledged_at
- resolved_at

### AUDIT_LOGS
- id (PK)
- user_id (FK -> USERS.id)
- action
- resource_type
- resource_id
- old_value
- new_value
- timestamp

## Relationships
- **CAMERAS (1) to (N) CAMERA_HEALTH**
- **CAMERAS (1) to (N) DETECTION_EVENTS**
- **CAMERAS (1) to (N) ALERTS**
- **WATCHLIST (1) to (N) ALERTS**
- **DETECTION_EVENTS (1) to (N) ALERTS**
- **USERS (1) to (N) AUDIT_LOGS**

## Important Indexes
- `camera_id` + `timestamp` (for fast time-series queries on events/health)
- `vehicle_number` + `timestamp` (for vehicle trace search)
- `identifier` (Watchlist lookups)
- `status` + `created_at` (Alerts queue)
- `status` (Cameras)
- `event_id` (Unique constraint for deduplication)

## ER Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string username
        string email
        string password_hash
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CAMERAS {
        uuid id PK
        string camera_id UK
        string name
        string department
        float latitude
        float longitude
        string camera_type
        string source_protocol
        string stream_endpoint_ref
        string status
        datetime last_heartbeat
        string zone
        jsonb storage_metadata
        boolean is_enabled
        datetime created_at
        datetime updated_at
    }

    CAMERA_HEALTH {
        uuid id PK
        string camera_id FK
        string status
        datetime heartbeat_at
        integer latency_ms
        jsonb metadata
        datetime created_at
    }

    DETECTION_EVENTS {
        uuid id PK
        string event_id UK
        string camera_id FK
        datetime timestamp
        string event_type
        string vehicle_number
        float confidence
        string vehicle_type
        jsonb bounding_box
        datetime created_at
    }

    WATCHLIST {
        uuid id PK
        string identifier UK
        string identifier_type
        string category
        string description
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    ALERTS {
        uuid id PK
        uuid detection_id FK
        string camera_id FK
        uuid watchlist_id FK
        string severity
        string status
        string message
        datetime created_at
        datetime acknowledged_at
        datetime resolved_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        string resource_id
        jsonb old_value
        jsonb new_value
        datetime timestamp
    }

    CAMERAS ||--o{ CAMERA_HEALTH : "logs"
    CAMERAS ||--o{ DETECTION_EVENTS : "generates"
    CAMERAS ||--o{ ALERTS : "has"
    WATCHLIST ||--o{ ALERTS : "triggers"
    DETECTION_EVENTS ||--o{ ALERTS : "causes"
    USERS ||--o{ AUDIT_LOGS : "performs"
```
