# Demo Data

This document catalogues the deterministic seed data injected into the database when the application provisions. This data allows for repeatable, consistent demonstrations.

## Users & Roles
- **Admin**: `testadmin` / `testpass` (Role: ADMIN)
- **Operator**: `testoperator` / `operpass` (Role: OPERATOR)
- **Viewer**: `testviewer` / `viewpass` (Role: VIEWER)

## Cameras
The backend explicitly seeds initial cameras for mapping and event association:
- `C001`: Main Gate Camera (Lat: 19.0760, Lng: 72.8777)
- `C002`: Exit Node (Lat: 19.0800, Lng: 72.8800)

## Watchlist Targets
A default target is active for Alert generation tests:
- **Plate Number**: `GJ01XX0001`
- **Reason**: Stolen Vehicle - Target A

## Deterministic Vehicle Sequence (Trace Demo)
To successfully demonstrate the Vehicle Trace functionality (which draws chronological polylines across map nodes), you can use the Analytics Simulator to push multiple events for the same plate (`GJ01XX0001`) with sequential timestamps across the seeded cameras (`C001` -> `C002`).

*Note: Passwords listed above are statically hashed during database initialization. Do not use these seeds in production environments.*
