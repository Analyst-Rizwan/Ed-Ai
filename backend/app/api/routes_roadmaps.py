from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_roadmaps():
    return [
        {
            "id": 1,
            "title": "React Developer Roadmap",
            "progress": 65,
            "xp": 1200,
            "color": "from-teal-500 to-green-500",
        },
        {
            "id": 2,
            "title": "Data Structures & Algorithms",
            "progress": 45,
            "xp": 900,
            "color": "from-orange-400 to-yellow-500",
        },
        {
            "id": 3,
            "title": "System Design Fundamentals",
            "progress": 30,
            "xp": 600,
            "color": "from-blue-400 to-indigo-500",
        },
    ]
