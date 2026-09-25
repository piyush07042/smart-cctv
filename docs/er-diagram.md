# Entity-Relationship (ER) Diagram

This document defines the persistent schema structure for the OKDriver CCTV Platform as implemented by SQLAlchemy and Alembic.

## Database Entities

### 1. User
- `id` (UUID, Primary Key)
- `username` (String, Unique)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (String: ADMIN, OPERATOR, VIEWER)
- `created_at` (DateTime)

### 2. Camera
- `id` (String, Primary Key, e.g., 'C001')
- `name` (String)
- `latitude` (Float)
- `longitude` (Float)
- `status` (String: ONLINE, DEGRADED, OFFLINE)
- `last_heartbeat` (DateTime)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### 3. Event
- `id` (UUID, Primary Key)
- `event_id` (String, Unique from edge)
- `camera_id` (String, ForeignKey -> Camera.id)
- `timestamp` (DateTime, Indexed)
- `event_type` (String, e.g., 'ANPR')
- `vehicle_number` (String, Indexed)
- `vehicle_type` (String)
- `confidence` (Float)
- `bounding_box` (JSON)
- `image_ref` (String)
- `metadata` (JSON)

### 4. Watchlist
- `id` (UUID, Primary Key)
- `plate_number` (String, Unique, Indexed)
- `reason` (String)
- `created_at` (DateTime)
- `updated_at` (DateTime)
- `active` (Boolean)

### 5. Alert
- `id` (UUID, Primary Key)
- `event_id` (UUID, ForeignKey -> Event.id)
- `watchlist_id` (UUID, ForeignKey -> Watchlist.id)
- `status` (String: NEW, ACKNOWLEDGED, RESOLVED, FALSE_POSITIVE)
- `created_at` (DateTime, Indexed)
- `updated_at` (DateTime)

### 6. Alert Action
- `id` (UUID, Primary Key)
- `alert_id` (UUID, ForeignKey -> Alert.id)
- `actor_id` (UUID, ForeignKey -> User.id)
- `action_type` (String)
- `notes` (String)
- `timestamp` (DateTime)

### 7. Audit Log
- `id` (UUID, Primary Key)
- `actor_id` (UUID, ForeignKey -> User.id)
- `action` (String)
- `resource` (String)
- `timestamp` (DateTime, Indexed)
- `details` (JSON)

## Relationships
- **Camera (1) -> (*) Event**: A camera generates multiple events.
- **Event (1) -> (1) Alert**: An event can trigger a maximum of one alert.
- **Watchlist (1) -> (*) Alert**: A target plate can be linked to multiple historical alerts over time.
- **Alert (1) -> (*) Alert Action**: An alert has a history of lifecycle transitions executed by users.
- **User (1) -> (*) Alert Action**: Users execute actions on alerts.
- **User (1) -> (*) Audit Log**: Users execute administrative actions resulting in logs.
