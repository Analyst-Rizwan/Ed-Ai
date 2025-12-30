# app/api/routes_leetcode.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.leetcode import LeetCodeSyncRequest, LeetCodeSyncResponse
from app.services.leetcode_service import sync_leetcode

router = APIRouter(tags=["LeetCode"])


@router.post("/sync", response_model=LeetCodeSyncResponse)
async def sync_profile(
    payload: LeetCodeSyncRequest,
    db: Session = Depends(get_db),
):
    # TEMPORARY DEV USER
    user_id = 1

    result = await sync_leetcode(
        db=db,
        user_id=user_id,
        username=payload.leetcode_username,
    )

    return LeetCodeSyncResponse(
        status="success",
        message="LeetCode synced successfully",
        problems_synced=result["problems_synced"],
        synced_at=result["synced_at"],
    )
