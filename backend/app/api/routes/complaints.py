from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.hr import Complaint
from app.services import auth_service

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return auth_service.get_current_user(token, db)


def format_complaint(c: Complaint):
    return {
        "id": f"comp-{c.id}",
        "title": c.title,
        "description": c.description,
        "category": c.category,
        "isAnonymous": c.is_anonymous,
        "submittedBy": c.submitted_by if not c.is_anonymous else "Anonymous Employee",
        "status": c.status or "pending",
        "priority": c.priority or "medium",
        "sentiment": c.sentiment or "neutral",
        "date": c.date
    }


@router.get("")
def list_complaints(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    return [format_complaint(c) for c in complaints]


@router.post("")
def submit_complaint(
    data: dict,
    db: Session = Depends(get_db)
):
    title = data.get("title", "")
    description = data.get("description", "")
    category = data.get("category", "other")
    is_anonymous = data.get("isAnonymous", False)
    submitted_by = data.get("submittedBy", "Anonymous Employee")

    # Sentiment + Priority Simulation
    text = (title + " " + description).lower()
    sentiment = "neutral"
    priority = "medium"

    if any(w in text for w in ["burnout", "harassment", "toxic", "abuse", "critical", "quit"]):
        sentiment = "negative"
        priority = "high"
    elif any(w in text for w in ["stress", "delay", "expensive", "broken", "unfair"]):
        sentiment = "negative"
        priority = "medium"
    elif any(w in text for w in ["clean", "pantry", "coffee", "keyboard"]):
        sentiment = "neutral"
        priority = "low"

    complaint = Complaint(
        title=title,
        description=description,
        category=category,
        is_anonymous=is_anonymous,
        submitted_by=submitted_by,
        status="pending",
        priority=priority,
        sentiment=sentiment,
        date=datetime.date.today().strftime("%Y-%m-%d")
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return format_complaint(complaint)


@router.post("/{id}/resolve")
def resolve_complaint(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    comp_id = None
    if id.startswith("comp-"):
        comp_id = int(id.split("-")[1])
    else:
        try:
            comp_id = int(id)
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid complaint ID format")

    complaint = db.query(Complaint).filter(Complaint.id == comp_id).first()
    if not complaint:
         raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = "resolved"
    db.commit()
    db.refresh(complaint)

    return format_complaint(complaint)
