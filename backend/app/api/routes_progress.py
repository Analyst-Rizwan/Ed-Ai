from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def get_progress():
    return {"progress": "75%", "status": "Keep going strong!"}
