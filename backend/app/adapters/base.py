from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class SourceAdapter(ABC):
    """
    Abstract base class for all camera source adapters.
    Provides a unified interface to heterogeneous video sources.
    """
    
    def __init__(self, camera_id: str, stream_endpoint_ref: Optional[str], credentials: Optional[Dict[str, str]] = None):
        self.camera_id = camera_id
        self.stream_endpoint_ref = stream_endpoint_ref
        self.credentials = credentials or {}

    @abstractmethod
    def connect(self) -> bool:
        """Initialize connection or verify source availability."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Get current health status of the source."""
        pass

    @abstractmethod
    def get_playback_url(self, client_ip: str) -> str:
        """
        Generate a secure, short-lived playback URL/token for the frontend.
        Must NOT expose raw RTSP or credentials.
        """
        pass

    @abstractmethod
    def get_snapshot(self) -> bytes:
        """Retrieve a JPEG snapshot if supported."""
        pass

    @abstractmethod
    def disconnect(self) -> None:
        """Clean up resources."""
        pass
