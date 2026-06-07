import io
import pdfplumber  # type: ignore
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.db.database import get_db
from app.models.user import User
from app.models.hr import Job, Candidate, Resume, CandidateStatus
from app.services import ats_service
from app.services.auth_service import get_current_user
from fastapi import Header

router = APIRouter()


def get_current_user_optional(authorization: str = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    """Optional authentication helper."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ")[1]
        return get_current_user(token, db)
    except Exception:
        return None


def get_current_user_required(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    """Required authentication helper."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return get_current_user(token, db)


@router.post("/screen")
def screen_resume_endpoint(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    resume_text = data.get("resume_text")
    job_id = data.get("job_id")

    if not resume_text or not job_id:
        raise HTTPException(status_code=400, detail="resume_text and job_id are required")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Estimate page count for pasted text (approx 400 words/page)
    estimated_pages = max(1, len(resume_text.split()) // 400 + 1)

    # Call AI ATS screening v2.0
    result = ats_service.score_resume_with_breakdown(resume_text, job.description, file_page_count=estimated_pages)
    ats_score = result.get("ats_score", 0)

    # If candidate is logged in, save the resume and update candidate score
    if current_user and current_user.role == "Candidate":
        cand = db.query(Candidate).filter(Candidate.user_id == current_user.id, Candidate.job_id == job_id).first()
        if cand:
            resume_record = Resume(
                candidate_id=cand.id,
                file_path="screened_text.txt",
                extracted_text=resume_text,
                score=ats_score,
                strengths=result.get("strengths", []),
                gaps=result.get("gaps", []),
                recommendation=result.get("recommendation", "maybe")
            )
            db.add(resume_record)
            cand.resume_score = float(ats_score)
            
            # Auto-advance status if score is above shortlist threshold (e.g. 85)
            # Find system settings for threshold
            from app.models.hr import SystemSettings
            settings_rec = db.query(SystemSettings).first()
            shortlist_thresh = settings_rec.ai_auto_shortlist_threshold if settings_rec else 85
            if ats_score >= shortlist_thresh:
                cand.status = CandidateStatus.screening
            db.commit()

    return result


@router.post("/upload")
def upload_resume_endpoint(
    file: UploadFile = File(...),
    job_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_bytes = file.file.read()
    extracted_text = ""
    file_name = file.filename

    page_count = 1
    if file_name.endswith(".pdf"):
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                page_count = len(pdf.pages)
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")
    else:
        extracted_text = file_bytes.decode("utf-8", errors="ignore")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded file contains no text")

    # Score resume v2.0
    result = ats_service.score_resume_with_breakdown(extracted_text, job.description, file_page_count=page_count)
    ats_score = result.get("ats_score", 0)

    # Save to candidate model if candidate exists
    if current_user and current_user.role == "Candidate":
        cand = db.query(Candidate).filter(Candidate.user_id == current_user.id, Candidate.job_id == job_id).first()
        if cand:
            resume_record = Resume(
                candidate_id=cand.id,
                file_path=file_name,
                extracted_text=extracted_text,
                score=ats_score,
                strengths=result.get("strengths", []),
                gaps=result.get("gaps", []),
                recommendation=result.get("recommendation", "maybe")
            )
            db.add(resume_record)
            cand.resume_score = float(ats_score)
            
            from app.models.hr import SystemSettings
            settings_rec = db.query(SystemSettings).first()
            shortlist_thresh = settings_rec.ai_auto_shortlist_threshold if settings_rec else 85
            if ats_score >= shortlist_thresh:
                cand.status = CandidateStatus.screening
            db.commit()

    # Format return JSON containing text + score breakdown + parsed resume
    return {
        "extracted_text": extracted_text,
        **result
    }


@router.get("/results/{candidate_id}")
def get_candidate_results(
    candidate_id: str,
    db: Session = Depends(get_db)
):
    # Parse candidate ID if format is cand-12
    raw_id = candidate_id
    if candidate_id.startswith("cand-"):
        raw_id = int(candidate_id.split("-")[1])
    else:
        raw_id = int(candidate_id)

    cand = db.query(Candidate).filter(Candidate.id == raw_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    resumes = db.query(Resume).filter(Resume.candidate_id == cand.id).order_by(Resume.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "file_path": r.file_path,
            "score": r.score,
            "strengths": r.strengths,
            "gaps": r.gaps,
            "recommendation": r.recommendation,
            "created_at": r.created_at
        } for r in resumes
    ]


@router.get("/rankings/{job_id}")
def get_job_ats_rankings(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidates_list = db.query(Candidate).filter(Candidate.job_id == job_id).all()
    results = []
    
    for cand in candidates_list:
        user = db.query(User).filter(User.id == cand.user_id).first()
        resume = db.query(Resume).filter(Resume.candidate_id == cand.id).order_by(Resume.id.desc()).first()
        
        # Calculate heuristics or retrieve structured score breakdown if available
        breakdown = {
            "keyword_match": 0,
            "skills_match": 0,
            "experience_match": 0,
            "education_match": 0,
            "format_score": 0
        }
        
        ats_score = int(cand.resume_score or 0)
        strengths = []
        gaps = []
        recommendation = "weak_match"

        if resume:
            ats_score = resume.score or ats_score
            strengths = resume.strengths or []
            gaps = resume.gaps or []
            recommendation = resume.recommendation or "maybe"
            
            # Simple reverse calculation if breakdown was not saved directly in DB column,
            # or parse from extracted_text if needed
            if getattr(resume, "breakdown", None):
                breakdown = resume.breakdown
            elif resume.extracted_text:
                try:
                    analysis = ats_service.score_resume_with_breakdown(resume.extracted_text, job.description)
                    breakdown = analysis.get("score_breakdown", breakdown)
                except Exception:
                    pass

        results.append({
            "candidate_id": f"cand-{cand.id}",
            "name": user.full_name if user else "Candidate",
            "email": user.email if user else "",
            "ats_score": ats_score,
            "score_breakdown": breakdown,
            "recommendation": recommendation,
            "strengths": strengths,
            "gaps": gaps,
            "status": cand.status.value if cand.status else "applied"
        })

    # Sort by score descending
    results.sort(key=lambda x: x["ats_score"], reverse=True)
    return results


@router.post("/bulk-screen")
def bulk_screen_resumes(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    job_id = data.get("job_id")
    resume_texts = data.get("resume_texts", [])

    if not job_id or not resume_texts:
        raise HTTPException(status_code=400, detail="job_id and resume_texts are required")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    results = []
    for text in resume_texts:
        res = ats_service.score_resume_with_breakdown(text, job.description)
        results.append(res)

    # Sort descending by score
    results.sort(key=lambda x: x.get("ats_score", 0), reverse=True)
    return results
