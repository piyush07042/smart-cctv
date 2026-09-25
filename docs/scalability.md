# Scalability

This document outlines how the current OKDriver CCTV Platform architecture can evolve to meet the target requirements of managing approximately 80,000 cameras.

## Current Implementation
The existing deployment represents a localized, single-region capability suitable for demonstration and small-to-medium deployments:
- **FastAPI**: Single or minimal-replica deployment.
- **PostgreSQL**: Single node monolithic relational store.
- **Redis**: Single node instance handling caching, rate limiting, and Pub/Sub.
- **MediaMTX**: Single instance handling localized RTSP streams.
- **Analytics**: Simulated payload ingestion.

## Target / Future Scale Architecture (80,000 Cameras)

### 1. Central Control Plane & Regional Gateways
To handle 80k cameras, the system must shift to an edge-regional-central architecture.
- **Regional Gateways**: Clusters of API servers physically closer to the camera networks will ingest events, handle initial stream proxying, and execute initial deduplication.
- **Central Plane**: The global dashboard aggregates metadata from Regional Gateways asynchronously.

### 2. Durable Event Streaming (Replacing Redis Pub/Sub)
Redis Pub/Sub is ephemeral. In a massive distributed network, network partitions cause data loss.
- **Future**: Introduce **Kafka** or **Redpanda** as the primary nervous system. Events from Regional Gateways will be produced to Kafka topics.
- Consumers on the Central Plane will process these topics, ensuring durable, at-least-once delivery for Watchlist processing and Alert generation.

### 3. Database Sharding & Read Replicas
A single PostgreSQL instance will struggle with the write-heavy load of 80,000 cameras generating thousands of events per second.
- **Future**: Transition Events and Audit Logs to specialized time-series databases (like TimescaleDB) or partition them geographically.
- Core relational data (Users, Watchlists) remain in PostgreSQL with geographically distributed read replicas.

### 4. GPU Inference Clusters
The simulated analytics payload will be replaced by actual inference.
- **Future**: Deploy Kubernetes-orchestrated GPU clusters at the edge or regionally. Cameras feed raw video to these clusters, which run YOLO/ANPR models and emit the JSON payloads the backend currently accepts.

### 5. WebSocket Fan-Out
A single FastAPI instance cannot hold millions of WebSocket connections efficiently.
- **Future**: Dedicated WebSocket connection gateways (e.g., using Centrifugo, Socket.io clustering, or NGINX push modules) that subscribe to Redis or Kafka backplanes and exclusively handle socket push logic independently from the core HTTP REST workers.

### 6. High Availability & Disaster Recovery
- All components must be containerized and orchestrated via Kubernetes.
- Multi-AZ (Availability Zone) deployments for Postgres and Redis.
- Active-Active load balancing across Regional Gateways.

### 7. Cost Considerations
- **Hot/Warm/Cold Storage**: Events older than 30 days should automatically migrate from expensive SSD relational storage to cheaper object storage (like AWS S3) to manage costs.
- Bandwidth optimization through intelligent motion-triggered streaming rather than continuous 24/7 centralized video recording.
