# Source Adapters Architecture

Phase 5 introduced a `SourceAdapter` abstraction to unify heterogeneous camera sources into a common playback interface.

## 1. SourceAdapter Interface

The core interface is defined in `backend/app/adapters/base.py`:
- `connect()`: Initializes connection.
- `get_status()`: Checks health state.
- `get_playback_url(client_ip)`: Resolves a secure, short-lived playback URL/token for frontend usage. It ensures raw credentials are never sent to the browser.
- `get_snapshot()`: Fetches a JPEG frame (stubbed).
- `disconnect()`: Teardown logic.

## 2. Adapter Registry

The factory `get_adapter(protocol, camera_id, ...)` lives in `backend/app/adapters/registry.py`. It looks up the associated adapter class by the database's `source_protocol` string.

- `RTSP` → `RtspAdapter`
- `HLS` → `HlsAdapter`
- `FILE` → `FileSimulatorAdapter`
- `ONVIF` → `OnvifMockAdapter`
- `VENDOR_API` → `VendorApiAdapter`

## 3. Implementations

### `RtspAdapter`
Typically, RTSP streams are ingested via `MediaMTX` which repackages them. This adapter proxies the playback to MediaMTX's HLS port (8888).

**C001 Source Flow (RTSP Simulation):**
1. An `ffmpeg` container generates a synthetic pattern and streams it via RTSP to MediaMTX.
2. MediaMTX receives the RTSP push at `rtsp://mediamtx:8554/cam/C001`.
3. The frontend requests playback for `C001`.
4. `RtspAdapter` returns `http://localhost:8888/cam/C001/index.m3u8` (MediaMTX HLS).

### `FileSimulatorAdapter`
Used for static file tests or synthetic simulators directly serving HLS segments.

**C002 Source Flow (HLS/File Simulation):**
1. An `ffmpeg` container continuously generates `.ts` chunks and an `index.m3u8` playlist on a shared volume `hls_data`.
2. An Nginx container `hls-server` mounts the volume and serves it over port `8080` with CORS headers.
3. The frontend requests playback for `C002`.
4. `FileSimulatorAdapter` returns `http://localhost:8080/index.m3u8`.

### `HlsAdapter`
Used for direct external HTTP Live Streams (e.g. CDNs). Proxies the URL directly after stripping embedded Basic Auth credentials if present.

### `OnvifMockAdapter` & `VendorApiAdapter`
Stubs representing future integration patterns where proprietary APIs or ONVIF WS-Discovery might be required to pull streams. Adding a new vendor means writing one Adapter class instead of altering FastAPI routes.
