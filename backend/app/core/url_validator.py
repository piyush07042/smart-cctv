"""
Stream URL / SSRF protection validator.

Design decision: We validate URLs at submission time by inspecting the parsed
URL structure. We do NOT make network requests during validation — that would
introduce latency and would itself be an SSRF vector.

Blocked by default:
- localhost / 127.x.x.x / ::1        (loopback)
- 0.0.0.0                             (unspecified)
- 10.x.x.x                           (RFC-1918 private)
- 172.16-31.x.x                      (RFC-1918 private)
- 192.168.x.x                        (RFC-1918 private)
- 169.254.x.x                        (link-local)
- fc00::/7                            (IPv6 ULA)
- fe80::/10                           (IPv6 link-local)
- Internal-sounding hostnames         (.local, .internal, .corp, .lan)

Explicitly allowed hosts can be added to SSRF_ALLOWED_HOSTS env var
(comma-separated) for dev/test environments with known-safe private streams.
"""
import ipaddress
import re
from urllib.parse import urlparse
from fastapi import HTTPException


# Hostnames that are obviously internal and should be blocked regardless of IP.
_BLOCKED_HOSTNAME_PATTERNS = re.compile(
    r"(^localhost$|\.local$|\.internal$|\.corp$|\.lan$|\.intranet$)",
    re.IGNORECASE,
)

_PRIVATE_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),       # link-local
    ipaddress.ip_network("127.0.0.0/8"),           # loopback
    ipaddress.ip_network("0.0.0.0/8"),             # unspecified
    ipaddress.ip_network("100.64.0.0/10"),         # shared address (CGNAT)
    ipaddress.ip_network("fc00::/7"),              # IPv6 ULA
    ipaddress.ip_network("fe80::/10"),             # IPv6 link-local
    ipaddress.ip_network("::1/128"),               # IPv6 loopback
]


def _is_private_ip(host: str) -> bool:
    try:
        addr = ipaddress.ip_address(host)
        return any(addr in net for net in _PRIVATE_NETWORKS)
    except ValueError:
        # Not a bare IP — treat as hostname, blocked by hostname check if needed.
        return False


def validate_stream_url(url: str, protocol: str, allowed_hosts: list[str] | None = None) -> str:
    """
    Validate a stream endpoint URL.

    Args:
        url: The raw URL submitted by the client.
        protocol: SourceProtocol enum value (RTSP, HLS, WEBRTC, FILE, ONVIF, VENDOR_API).
        allowed_hosts: Optional explicit allow-list (from env SSRF_ALLOWED_HOSTS).

    Returns:
        The normalised URL if valid.

    Raises:
        HTTPException 422 for invalid/unsafe URLs.
    """
    if not url:
        raise HTTPException(status_code=422, detail="stream_endpoint_ref is required")

    parsed = urlparse(url)
    scheme = (parsed.scheme or "").lower()
    host = (parsed.hostname or "").lower()

    # --- Protocol / scheme alignment ---
    scheme_map = {
        "RTSP": ("rtsp", "rtsps"),
        "ONVIF": ("rtsp", "http", "https"),
        "HLS": ("http", "https"),
        "WEBRTC": ("http", "https", "webrtc"),
        "VENDOR_API": ("http", "https"),
        "FILE": ("file", ""),  # file path or bare relative path
    }

    allowed_schemes = scheme_map.get(protocol.upper(), ())
    if allowed_schemes and scheme not in allowed_schemes:
        raise HTTPException(
            status_code=422,
            detail=f"Protocol {protocol} requires scheme {allowed_schemes}, got '{scheme}'",
        )

    # FILE protocol — skip SSRF check, treat as local managed path.
    if protocol.upper() == "FILE":
        return url

    if not host:
        raise HTTPException(status_code=422, detail="stream_endpoint_ref must contain a valid host")

    # --- Explicit allow-list (for dev/test private streams) ---
    if allowed_hosts and host in [h.lower() for h in allowed_hosts]:
        return url

    # --- Hostname pattern check ---
    if _BLOCKED_HOSTNAME_PATTERNS.search(host):
        raise HTTPException(
            status_code=422,
            detail=f"Stream endpoint host '{host}' resolves to an internal address (SSRF protection)",
        )

    # --- IP address range check ---
    if _is_private_ip(host):
        raise HTTPException(
            status_code=422,
            detail=f"Stream endpoint IP '{host}' is in a private/reserved range (SSRF protection)",
        )

    return url
