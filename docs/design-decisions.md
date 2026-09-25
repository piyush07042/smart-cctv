# Design Decisions

## DECISION 1: Why FastAPI?
- Python ecosystem provides excellent libraries for AI/ML and data manipulation.
- Built-in OpenAPI/Swagger documentation generation.
- Asynchronous by default, highly suitable for event APIs.
- Easy integration with future analytics and AI models.

## DECISION 2: Why PostgreSQL?
- Relational integrity is crucial for linking cameras, events, and watchlists.
- PostGIS ecosystem makes it highly GIS-compatible for map-based features.
- Strong indexing capabilities support complex queries.
- Proven reliability for mission-critical data.

## DECISION 3: Why Redis Pub/Sub?
- Provides simple real-time fan-out for the prototype.
- Extremely easy integration with FastAPI WebSockets.
- Redis acts as a versatile tool for Pub/Sub, key/value caching, rate limiting, and deduplication.
- Architecture allows for future migration to Kafka for durable, high-scale event streaming if needed.

## DECISION 4: Why adapters?
- Vendor/protocol isolation protects the core business logic.
- Camera hardware is diverse; adapters provide a normalized interface.
- Easier future integration with standard protocols like ONVIF or proprietary VMS systems.

## DECISION 5: Why MediaMTX?
- Serves as an excellent RTSP/HLS/WebRTC bridge out of the box.
- Suitable for prototype video ingestion and low-latency playback in browsers.
- Avoids the complexity of writing custom WebRTC negotiation servers for the MVP.

## DECISION 6: Why mock analytics?
- The assignment allows for analytics simulation.
- Focuses effort on the platform architecture (ingestion, routing, presentation) rather than ML model training.
- The same event API is designed to accept a real AI service later with zero backend changes.

## DECISION 7: Why browser does not receive raw RTSP URLs?
- **Security:** Browsers cannot natively play RTSP securely without exposing stream credentials.
- Credentials must remain strictly server-side.
- The browser receives a controlled, tokenized playback URL (HLS/WebRTC) instead, handled by the media gateway.
