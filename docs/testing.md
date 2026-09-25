# Testing Strategy & Quality Assurance

The okdriver-cctv-platform employs a comprehensive, multi-layered testing strategy to guarantee data integrity, strict access control, and uninterrupted video and analytics processing.

## Test Layers

1. **Unit Testing (Backend)**: Executed via `pytest`. Validates core domain logic including token validation, deduplication windows, event models, and health transitions. Mocks out heavy integrations like Redis where applicable.
2. **Integration Testing (Backend)**: Executed against live, isolated PostgreSQL and Redis instances. Validates CRUD, JWT flows, WebSocket authentication, and DB queries.
3. **Frontend Build & Validation**: Tests UI component stability, type correctness, and component rendering logic. (Vitest/RTL or purely TypeScript typechecking and Vite builds).
4. **End-to-End Testing (System)**: Manual and deterministic real-time validations running via Docker Compose encompassing video processing, WebSockets, health probes, and live frontend updates.

## How to Run Tests

### Backend
Make sure you are in the python environment and run:
```bash
cd backend
python -m pytest
```

### Coverage
To view the coverage report:
```bash
python -m pytest --cov=app --cov-report=term-missing
```

### Frontend
To validate the frontend build:
```bash
cd frontend
npm run typecheck
npm run build
```

## Security & Penetration Testing
Security validations (Phase 10 requirements) explicitly verify:
- Unauthorized endpoints return 403 Forbidden.
- Unauthenticated endpoints return 401 Unauthorized.
- Spam requests trigger 429 Too Many Requests (Redis rate limiting).
- Real secrets are not checked into source (verified by `gitleaks`/`git grep` secret scans).

## Docker Deployment Validation
A full stack validation via Docker Compose:
```bash
docker compose -f docker-compose.yml -f docker-compose.tls.yml config
docker compose up -d
```
All services should report `Healthy`.

## Deterministic Demo Data
Test environments must be seeded using fixed, non-random data sets:
- **Cameras**: `C001`, `C002`, `C003` with predefined static lat/lng coordinates.
- **Watchlist**: Target Plate `GJ01XX0001` explicitly defined to test match events.
- **Events**: Fixed confidence scores and ISO-8601 timestamps.

## Known Limitations
- End-to-End WebSocket tests inside standard CI pipelines may be flaky depending on the Redis message delivery speed; mock environments are preferred for CI unit tests.
- Pydantic payload max_size limits rely on ASGI settings which are harder to test with strict unittests natively.
