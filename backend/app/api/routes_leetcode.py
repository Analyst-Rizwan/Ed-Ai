# backend/app/api/routes_leetcode.py
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.leetcode import LeetCodeSyncRequest, LeetCodeSyncResponse
from app.services.leetcode_service import sync_leetcode
from app.core.rate_limit import limiter

router = APIRouter(tags=["LeetCode"])


@router.post("/sync", response_model=LeetCodeSyncResponse)
@limiter.limit("2/minute")
async def sync_profile(
    request: Request,
    payload: LeetCodeSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await sync_leetcode(
        db=db,
        user_id=current_user.id,
        username=payload.leetcode_username,
    )

    return LeetCodeSyncResponse(
        status="success",
        message="LeetCode synced successfully",
        problems_synced=result["problems_synced"],
        synced_at=result["synced_at"],
    )
