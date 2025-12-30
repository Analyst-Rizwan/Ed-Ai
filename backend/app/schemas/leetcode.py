from pydantic import BaseModel, validator
from typing import Optional, List, Dict
from datetime import datetime


class LeetCodeProfile(BaseModel):
    username: str
    
    @validator('username')
    def validate_username(cls, v):
        if not v or len(v) < 1:
            raise ValueError('LeetCode username is required')
        # Remove any whitespace
        v = v.strip()
        # Remove URL if user pasted full profile URL
        if 'leetcode.com' in v.lower():
            v = v.split('/')[-1] if '/' in v else v
        return v


class LeetCodeStats(BaseModel):
    total_solved: int = 0
    easy_solved: int = 0
    medium_solved: int = 0
    hard_solved: int = 0
    acceptance_rate: float = 0.0
    ranking: Optional[int] = None
    reputation: Optional[int] = None
    contribution_points: Optional[int] = 0


class LeetCodeSyncRequest(BaseModel):
    leetcode_username: str
    auto_sync: bool = False


class LeetCodeSyncResponse(BaseModel):
    status: str
    message: str
    stats: Optional[LeetCodeStats] = None
    synced_at: Optional[datetime] = None
    problems_synced: int = 0


class LeetCodeSyncStatus(BaseModel):
    is_connected: bool
    leetcode_username: Optional[str] = None
    last_synced: Optional[datetime] = None
    stats: Optional[LeetCodeStats] = None
    auto_sync: bool = False