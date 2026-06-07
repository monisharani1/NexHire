from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.database import get_db
from app.models.user import User
from app.models.hr import Job

router = APIRouter()

@router.get("/")
def global_search(q: str, db: Session = Depends(get_db)):
    if not q or len(q) < 2:
        return {"users": [], "jobs": []}

    search_term = f"%{q}%"

    # Search Users
    users = db.query(User).filter(
        or_(
            User.full_name.ilike(search_term),
            User.tagline.ilike(search_term),
            User.designation.ilike(search_term),
            User.company.ilike(search_term),
            User.role.ilike(search_term)
        )
    ).limit(5).all()

    # Search Jobs
    jobs = db.query(Job).filter(
        or_(
            Job.title.ilike(search_term),
            Job.description.ilike(search_term)
        )
    ).limit(5).all()

    return {
        "users": [
            {
                "id": u.id,
                "name": u.full_name,
                "role": u.role,
                "tagline": u.tagline,
                "photo_url": u.photo_url
            } for u in users
        ],
        "jobs": [
            {
                "id": j.id,
                "title": j.title,
                "department": "General",
                "location": "Remote",
                "type": "Full-Time"
            } for j in jobs
        ]
    }
