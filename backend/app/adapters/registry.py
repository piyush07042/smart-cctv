from typing import Dict, Any, Type, Optional
from .base import SourceAdapter
from .rtsp import RtspAdapter
from .hls import HlsAdapter
from .file_simulator import FileSimulatorAdapter
from .onvif_mock import OnvifMockAdapter
from .vendor_api import VendorApiAdapter

# Registry mapping protocol enum strings to adapter classes
ADAPTER_REGISTRY: Dict[str, Type[SourceAdapter]] = {
    "RTSP": RtspAdapter,
    "ONVIF": OnvifMockAdapter,
    "HLS": HlsAdapter,
    "VENDOR_API": VendorApiAdapter,
    "FILE": FileSimulatorAdapter,
    # WebRTC generally uses RTSP/WebRTC ingest on MediaMTX, we can default it or add WebRtcAdapter
}

def get_adapter(protocol: str, camera_id: str, stream_endpoint_ref: Optional[str] = None, credentials: Optional[Dict[str, str]] = None) -> SourceAdapter:
    """
    Factory function to instantiate the correct SourceAdapter for a camera.
    """
    adapter_class = ADAPTER_REGISTRY.get(protocol, RtspAdapter)
    return adapter_class(camera_id, stream_endpoint_ref, credentials)
