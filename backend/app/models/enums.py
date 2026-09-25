"""
Camera enums — single source of truth used by models, schemas, and services.
"""
from enum import Enum


class CameraType(str, Enum):
    FIXED = "FIXED"
    PTZ = "PTZ"
    ANPR = "ANPR"
    DASHCAM = "DASHCAM"


class SourceProtocol(str, Enum):
    RTSP = "RTSP"
    ONVIF = "ONVIF"
    HLS = "HLS"
    WEBRTC = "WEBRTC"
    VENDOR_API = "VENDOR_API"
    FILE = "FILE"


class CameraStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    DEGRADED = "DEGRADED"
