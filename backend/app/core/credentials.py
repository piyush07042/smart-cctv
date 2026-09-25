"""
Fernet-based stream credential encryption.

Usage:
    svc = CredentialService()
    blob = svc.encrypt("rtsp://user:pass@cam.local/stream")
    plain = svc.decrypt(blob)

Security rules:
- Only backend code that needs to connect to the stream should call decrypt().
- Never return the blob or the plain-text from API endpoints.
- Return has_credentials: bool instead.
- The FERNET_KEY must come from the environment, never from source code.
"""
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings


class CredentialService:
    def __init__(self):
        # Key is validated on construction — raises ValueError for bad keys.
        self._fernet = Fernet(settings.FERNET_KEY.encode())

    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext credentials to a base64 token string."""
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, token: str) -> str:
        """Decrypt a token produced by encrypt(). Raises InvalidToken on tamper."""
        return self._fernet.decrypt(token.encode()).decode()

    def has_credentials(self, encrypted_blob: str | None) -> bool:
        """Safe boolean helper for API responses."""
        return encrypted_blob is not None and len(encrypted_blob) > 0


# Module-level singleton — constructed lazily per-request is also fine.
credential_service = CredentialService()
