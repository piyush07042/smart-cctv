from typing import Dict, Any
from .base import SourceAdapter
import os

class RtspAdapter(SourceAdapter):
    """
    Adapter for standard RTSP cameras.
    In this system, RTSP sources are ingested by MediaMTX.
    We return the MediaMTX HLS URL for frontend playback.
    """
    
    def connect(self) -> bool:
        # In a real system, we might probe the RTSP stream here.
        return True

    def get_status(self) -> Dict[str, Any]:
        return {"status": "ONLINE", "latency": "low"}

    def get_playback_url(self, client_ip: str) -> str:
        # MediaMTX exposes HLS at port 8888 by default.
        # Use MEDIAMTX_HLS_URL or fallback.
        # Example output: http://localhost:8888/cam/C001/index.m3u8
        # In a real system we would append a signed JWT token here for security.
        base_url = os.getenv("MEDIAMTX_PUBLIC_URL", "http://localhost:8888")
        # Ensure we don't expose any internal passwords
        return f"{base_url}/cam/{self.camera_id}/index.m3u8"

    def get_snapshot(self) -> bytes:
        # Stub
        return b""

    def disconnect(self) -> None:
        pass
