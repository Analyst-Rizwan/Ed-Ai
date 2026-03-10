# backend/app/core/encryption.py
"""
Fernet-based field encryption for sensitive data stored in the database.
Used for: GitHub access tokens, future OAuth tokens, etc.

The encryption key is derived from SECRET_KEY for simplicity.
In production, consider using a dedicated encryption key (separate from JWT signing).
"""
import base64
import hashlib
from cryptography.fernet import Fernet


def _get_fernet_key(secret_key: str) -> bytes:
    """Derive a Fernet-compatible key from the app SECRET_KEY."""
    # Fernet requires a 32-byte base64-encoded key
    key_bytes = hashlib.sha256(secret_key.encode()).digest()
    return base64.urlsafe_b64encode(key_bytes)


def encrypt_value(value: str, secret_key: str) -> str:
    """Encrypt a plaintext string. Returns a base64-encoded ciphertext string."""
    if not value:
        return value
    key = _get_fernet_key(secret_key)
    f = Fernet(key)
    return f.encrypt(value.encode()).decode()


def decrypt_value(encrypted_value: str, secret_key: str) -> str:
    """Decrypt a Fernet-encrypted string. Returns plaintext."""
    if not encrypted_value:
        return encrypted_value
    key = _get_fernet_key(secret_key)
    f = Fernet(key)
    return f.decrypt(encrypted_value.encode()).decode()
