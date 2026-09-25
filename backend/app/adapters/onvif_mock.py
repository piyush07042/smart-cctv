from typing import Dict, Any
from .base import SourceAdapter

class OnvifMockAdapter(SourceAdapter):
    """
    Mock adapter representing ONVIF Profile S/T compatibility.
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
