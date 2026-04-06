"""Supabase Storage helper — upload / delete avatar images."""

import httpx
import uuid
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
    }


def _storage_url(path: str = "") -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    return f"{base}/storage/v1/object/{path}"


def is_configured() -> bool:
    """Return True if Supabase Storage keys are set."""
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)


async def upload_avatar(user_id: int, file_bytes: bytes, content_type: str, extension: str) -> str:
    """
    Upload avatar to Supabase Storage. Returns the public URL.
    Raises ValueError on validation failure, RuntimeError on upload failure.
    """
    if not is_configured():
        raise RuntimeError("Supabase Storage is not configured")

    if content_type not in ALLOWED_TYPES:
        raise ValueError(f"File type '{content_type}' not allowed. Use JPEG, PNG, WebP, or GIF.")

    if len(file_bytes) > MAX_SIZE_BYTES:
        raise ValueError(f"File too large ({len(file_bytes) // 1024}KB). Maximum is 2MB.")

    # Generate unique filename
    filename = f"{user_id}/{uuid.uuid4().hex[:12]}.{extension}"
    bucket = settings.SUPABASE_STORAGE_BUCKET

    url = _storage_url(f"{bucket}/{filename}")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.put(
            url,
            content=file_bytes,
            headers={
                **_headers(),
                "Content-Type": content_type,
                "x-upsert": "true",
            },
        )

        if resp.status_code not in (200, 201):
            logger.error(f"[supabase] Upload failed: {resp.status_code} {resp.text}")
            raise RuntimeError(f"Upload failed: {resp.text}")

    # Build public URL
    public_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{bucket}/{filename}"
    logger.info(f"[supabase] Avatar uploaded for user {user_id}: {public_url}")
    return public_url


async def delete_avatar(avatar_url: str) -> bool:
    """
    Delete an avatar from Supabase Storage by its public URL.
    Returns True if deleted, False if not a Supabase URL or failed.
    """
    if not is_configured():
        return False

    # Only delete if it's our Supabase URL
    bucket = settings.SUPABASE_STORAGE_BUCKET
    prefix = f"/storage/v1/object/public/{bucket}/"

    if prefix not in avatar_url:
        logger.info(f"[supabase] Skipping delete — not a Supabase avatar URL: {avatar_url}")
        return False

    # Extract path after bucket
    file_path = avatar_url.split(prefix)[-1]
    url = _storage_url(f"{bucket}/{file_path}")

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.delete(url, headers=_headers())

        if resp.status_code in (200, 204):
            logger.info(f"[supabase] Deleted avatar: {file_path}")
            return True
        else:
            logger.warning(f"[supabase] Delete failed: {resp.status_code} {resp.text}")
            return False
