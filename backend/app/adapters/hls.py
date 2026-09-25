from typing import Dict, Any
from .base import SourceAdapter

class HlsAdapter(SourceAdapter):
    """
    Adapter for direct HLS sources (like third-party CDN or existing transcoder).
    """
    
    def connect(self) -> bool:
        return True

    def get_status(self) -> Dict[str, Any]:
        return {"status": "ONLINE"}

    def get_playback_url(self, client_ip: str) -> str:
        # If we have a stream_endpoint_ref, we might just proxy it or return it directly.
        # But we must hide credentials if present.
        url = self.stream_endpoint_ref or ""
        # Strip simple auth if present in the ref (though we shouldn't store it there).
        if "@" in url and "://" in url:
            protocol, rest = url.split("://", 1)
            if "@" in rest:
                _, safe_url = rest.split("@", 1)
                url = f"{protocol}://{safe_url}"
        
        # In this demo, we assume C002 is an HLS source served by MediaMTX or similar public endpoint
        if not url:
            base_url = "http://localhost:8888"
            url = f"{base_url}/cam/{self.camera_id}/index.m3u8"
            
        return url

    def get_snapshot(self) -> bytes:
        return b""

    def disconnect(self) -> None:
        pass
