from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.hr import Job
from app.services import auth_service

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return auth_service.get_current_user(token, db)


def parse_job_id(id_str: str) -> int:
    if id_str.startswith("job-"):
        return int(id_str.split("-")[1])
    try:
        return int(id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")


def format_job(job: Job):
    return {
        "id": f"job-{job.id}",
        "title": job.title,
        "department": "Engineering" if "Engineer" in job.title or "Developer" in job.title else "HR",
        "description": job.description,
        "requirements": job.required_skills or [],
        "status": "open" if job.is_active else "closed",
        "max_applications": job.max_applications,
        "current_applications": job.current_applications,
        "ats_reject_threshold": job.ats_reject_threshold,
        "ats_advance_threshold": job.ats_advance_threshold,
        "interview_type": job.interview_type,
        "interview_questions": job.interview_questions,
        "interview_time_limit": job.interview_time_limit,
        "score_weight_ats": job.score_weight_ats,
        "score_weight_video": job.score_weight_video,
        "score_weight_portfolio": job.score_weight_portfolio,
        "is_open": job.is_open,
        "deadline": job.deadline
    }


@router.get("")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return [format_job(j) for j in jobs]


@router.post("")
def create_job(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized to create jobs")

    job = Job(
        title=data.get("title"),
        description=data.get("description"),
        required_skills=data.get("requirements", []),
        created_by=current_user.id,
        is_active=True,
        max_applications=data.get("max_applications"),
        ats_reject_threshold=data.get("ats_reject_threshold"),
        ats_advance_threshold=data.get("ats_advance_threshold"),
        interview_type=data.get("interview_type"),
        interview_questions=data.get("interview_questions"),
        interview_time_limit=data.get("interview_time_limit"),
        score_weight_ats=data.get("score_weight_ats"),
        score_weight_video=data.get("score_weight_video"),
        score_weight_portfolio=data.get("score_weight_portfolio"),
        is_open=data.get("is_open", True),
        deadline=data.get("deadline")
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return format_job(job)


@router.put("/{id}/status")
def update_job_status(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    job_id = parse_job_id(id)
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    status_str = data.get("status")
    if status_str:
        job.is_active = (status_str == "open")
    
    db.commit()
    db.refresh(job)
    return format_job(job)


@router.put("/{id}")
def update_job(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized role")

    job_id = parse_job_id(id)
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    for field in ["title", "description", "requirements", "max_applications", 
                  "ats_reject_threshold", "ats_advance_threshold", "interview_type", 
                  "interview_questions", "interview_time_limit", "score_weight_ats", 
                  "score_weight_video", "score_weight_portfolio", "is_open", "deadline"]:
        if field in data:
            if field == "requirements":
                job.required_skills = data["requirements"]
            else:
                setattr(job, field, data[field])

    db.commit()
    db.refresh(job)
    return format_job(job)
