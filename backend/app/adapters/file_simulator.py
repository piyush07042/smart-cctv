from typing import Dict, Any
from .base import SourceAdapter
import os

class FileSimulatorAdapter(SourceAdapter):
    """
    Adapter for testing using a static file or simulated loop.
    In Phase 5, we use this for C002, mapping it to a MediaMTX path or raw file.
    """
    
    def connect(self) -> bool:
        return True

    def get_status(self) -> Dict[str, Any]:
        return {"status": "ONLINE", "mode": "simulator"}

    def get_playback_url(self, client_ip: str) -> str:
        # C002 uses the static file simulator (nginx serving HLS on port 8080)
        base_url = os.getenv("HLS_SERVER_URL", "http://localhost:8080")
        return f"{base_url}/index.m3u8"

    def get_snapshot(self) -> bytes:
        return b""

    def disconnect(self) -> None:
        pass
