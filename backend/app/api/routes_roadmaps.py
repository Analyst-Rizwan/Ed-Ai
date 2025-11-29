from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def get_roadmaps():
    return {"roadmaps": ["Data Science", "AI Engineering", "Web Development"]}
