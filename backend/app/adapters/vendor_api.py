from typing import Dict, Any
from .base import SourceAdapter

class VendorApiAdapter(SourceAdapter):
    """
    Stub adapter for proprietary vendor SDKs/APIs (e.g. Hikvision ISAPI, Dahua).
    """
    
    def connect(self) -> bool:
        return True

    def get_status(self) -> Dict[str, Any]:
        return {"status": "ONLINE"}

    def get_playback_url(self, client_ip: str) -> str:
        return ""

    def get_snapshot(self) -> bytes:
        return b""

    def disconnect(self) -> None:
        pass
