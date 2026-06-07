from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlalchemy.orm import Session
import pdfplumber  # type: ignore
import io
import json
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.hr import Candidate, Resume, ChatMessage, Job, CandidateStatus, CandidateNote
from app.services import ai_service
from app.services.auth_service import get_current_user
from app.core.security import hash_password

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return get_current_user(token, db)


def parse_cand_id(id_str: str) -> int:
    if id_str.startswith("cand-"):
        return int(id_str.split("-")[1])
    try:
        return int(id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")


def format_candidate(cand: Candidate, user: User, job: Job, db: Session):
    resume = db.query(Resume).filter(Resume.candidate_id == cand.id).order_by(Resume.id.desc()).first()
    
    stage = cand.status.value if cand.status else "applied"
    if stage == "interviewed":
        stage = "interviewing"

    match_details = ["Awaiting resume upload/scanning"]
    if resume:
        match_details = []
        if resume.strengths:
            match_details.extend([f"Strength: {s}" for s in resume.strengths])
        if resume.gaps:
            match_details.extend([f"Gap: {g}" for g in resume.gaps])
        if not match_details:
            match_details = ["Resume successfully scanned"]

    notes = db.query(CandidateNote).filter(CandidateNote.candidate_id == cand.id).order_by(CandidateNote.created_at.desc()).all()
    formatted_notes = [{"id": n.id, "text": n.note, "date": n.created_at.isoformat() if n.created_at else None, "author_id": n.hr_user_id} for n in notes]

    return {
        "id": f"cand-{cand.id}",
        "name": user.full_name or user.username or "Candidate",
        "email": user.email,
        "roleApplied": job.title if job else "Software Engineer",
        "phone": user.phone or "+1-555-0100",
        "college": user.college,
        "gender": getattr(user, 'gender', None),
        "year_of_passing": getattr(user, 'year_of_passing', None),
        "atsScore": int(resume.score) if resume and resume.score is not None else int(cand.resume_score or 0),
        "breakdown": getattr(resume, "breakdown", None) if resume else None,
        "matchDetails": match_details,
        "stage": stage,
        "resumeName": resume.file_path.split("/")[-1] if resume and resume.file_path else "resume.pdf",
        "interviewScore": int(cand.interview_score or 0),
        "videoMetrics": {
            "technical": 85 if cand.interview_score else 0,
            "communication": 88 if cand.interview_score else 0,
            "confidence": 80 if cand.interview_score else 0,
            "eyeContact": 82 if cand.interview_score else 0,
            "clarity": 84 if cand.interview_score else 0
        },
        "notes": formatted_notes
    }


@router.get("")
def list_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).all()
    result = []
    for cand in candidates:
        user = db.query(User).filter(User.id == cand.user_id).first()
        job = db.query(Job).filter(Job.id == cand.job_id).first()
        if user and job:
            result.append(format_candidate(cand, user, job, db))
    return result


@router.post("")
def add_candidate(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    email = data.get("email")
    name = data.get("name")
    role_applied = data.get("roleApplied", "Senior Frontend Engineer")

    # 1. Resolve Job ID
    job = db.query(Job).filter(Job.title == role_applied).first()
    if not job:
        # Fallback: find any job or create one
        job = db.query(Job).first()
        if not job:
            job = Job(title=role_applied, description="Job description details.", created_by=current_user.id)
            db.add(job)
            db.commit()
            db.refresh(job)

    # Job Restrictions Check
    if not job.is_active or not job.is_open:
        raise HTTPException(status_code=400, detail="This job is no longer accepting applications.")
    
    if job.deadline and datetime.utcnow() > job.deadline:
        raise HTTPException(status_code=400, detail="The deadline for this job has passed.")

    if job.max_applications is not None and job.current_applications >= job.max_applications:
        raise HTTPException(status_code=400, detail="This job has reached the maximum number of applications.")

    # 2. Check/create User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=name,
            password_hash=hash_password("Password123"),
            role="Candidate",
            phone=data.get("phone", "+1-555-0100"),
            college=data.get("college"),
            gender=data.get("gender"),
            year_of_passing=data.get("year_of_passing")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if name:
            user.full_name = name
        if data.get("phone"):
            user.phone = data.get("phone")
        if data.get("college"):
            user.college = data.get("college")
        if data.get("gender"):
            user.gender = data.get("gender")
        if data.get("year_of_passing"):
            user.year_of_passing = data.get("year_of_passing")
        db.commit()

    # 3. Create Candidate
    cand = db.query(Candidate).filter(Candidate.user_id == user.id, Candidate.job_id == job.id).first()
    if not cand:
        cand = Candidate(
            user_id=user.id,
            job_id=job.id,
            status=CandidateStatus.applied,
            resume_score=0.0,
            portfolio_score=0.0,
            interview_score=0.0
        )
        db.add(cand)
        
        # Increment job application count
        if job.current_applications is None:
            job.current_applications = 0
        job.current_applications += 1
        
        db.commit()
        db.refresh(cand)

    return format_candidate(cand, user, job, db)


@router.put("/{id}/stage")
def update_stage(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    cand_id = parse_cand_id(id)
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    stage_str = data.get("stage")
    # Map "interviewing" back to interviewed
    if stage_str == "interviewing":
         stage_str = "interviewed"
         
    if stage_str in CandidateStatus.__members__:
         cand.status = CandidateStatus[stage_str]
    else:
         raise HTTPException(status_code=400, detail=f"Invalid stage status: {stage_str}")

    db.commit()
    db.refresh(cand)

    user = db.query(User).filter(User.id == cand.user_id).first()
    job = db.query(Job).filter(Job.id == cand.job_id).first()
    return format_candidate(cand, user, job, db)


@router.post("/{id}/note")
def add_candidate_note(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="Only HR can add notes")

    cand_id = parse_cand_id(id)
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    note_text = data.get("note")
    if not note_text:
        raise HTTPException(status_code=400, detail="Note text is required")

    note = CandidateNote(
        candidate_id=cand.id,
        hr_user_id=current_user.id,
        note=note_text
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    user = db.query(User).filter(User.id == cand.user_id).first()
    job = db.query(Job).filter(Job.id == cand.job_id).first()
    return format_candidate(cand, user, job, db)


@router.put("/{id}/interview")
def update_candidate_interview(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    cand_id = parse_cand_id(id)
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand:
         raise HTTPException(status_code=404, detail="Candidate not found")

    score = data.get("score", 0)
    cand.interview_score = float(score)
    db.commit()
    db.refresh(cand)

    user = db.query(User).filter(User.id == cand.user_id).first()
    job = db.query(Job).filter(Job.id == cand.job_id).first()
    return format_candidate(cand, user, job, db)


@router.post("/{id}/screen")
def screen_candidate_resume(
    id: str,
    file: UploadFile = File(None),
    text_content: str = Form(None),
    db: Session = Depends(get_db)
):
    cand_id = parse_cand_id(id)
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = db.query(Job).filter(Job.id == cand.job_id).first()
    job_desc = job.description if job else "Senior React Frontend Developer with TypeScript, TailwindCSS expertise."

    extracted_text = ""
    file_name = "resume.pdf"

    if file:
        file_name = file.filename
        file_bytes = file.file.read()
        if file.filename.endswith(".pdf"):
            try:
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            extracted_text += page_text + "\n"
            except Exception:
                extracted_text = "Failed to parse PDF file."
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
    elif text_content:
        extracted_text = text_content

    if not extracted_text.strip():
        # No text extracted — return a low score instead of faking content
        ai_res = {
            "score": 10,
            "strengths": [],
            "gaps": ["No readable content found in uploaded file"],
            "recommendation": "reject"
        }
        resume_record = Resume(
            candidate_id=cand.id,
            file_path=file_name,
            extracted_text="[No text extracted]",
            score=10,
            strengths=[],
            gaps=["No readable content"],
            recommendation="reject"
        )
        db.add(resume_record)
        cand.resume_score = 10.0
        db.commit()
        user = db.query(User).filter(User.id == cand.user_id).first()
        return format_candidate(cand, user, job, db)

    # Call Advanced ATS Scoring (which includes strict gatekeeping)
    from app.services import ats_service
    try:
        ai_res = ats_service.score_resume_with_breakdown(extracted_text, job_desc)
        # Map the ats_score key to what the candidate route expects
        if "ats_score" in ai_res:
            ai_res["score"] = ai_res["ats_score"]
    except Exception:
        # Fallback offline screening with strict base score
        score = 40
        strengths = []
        gaps = []
        txt_lower = extracted_text.lower()
        if "react" in txt_lower or "frontend" in txt_lower:
            score += 8; strengths.append("React Development")
        if "typescript" in txt_lower:
            score += 6; strengths.append("TypeScript competency")
        if "python" in txt_lower or "fastapi" in txt_lower:
            score += 6; strengths.append("Python backend")
        if "sql" in txt_lower or "database" in txt_lower:
            score += 5; strengths.append("Database knowledge")
        if not strengths:
            gaps.append("No relevant technical skills detected")
        ai_res = {
            "score": min(score, 99),
            "strengths": strengths if strengths else ["General content"],
            "gaps": gaps if gaps else ["Cloud Architecture"],
            "recommendation": "hire" if score >= 70 else ("maybe" if score >= 50 else "reject")
        }

    # If gate failed, raise error to prompt user to re-upload
    if ai_res.get("gate_failed"):
        raise HTTPException(
            status_code=400, 
            detail=ai_res.get("gate_reason", "Invalid document format. Please upload a valid resume.")
        )

    # Store Resume Record
    resume_record = Resume(
        candidate_id=cand.id,
        file_path=file_name,
        extracted_text=extracted_text,
        score=ai_res.get("score", 70),
        strengths=ai_res.get("strengths", []),
        gaps=ai_res.get("gaps", []),
        breakdown=ai_res.get("score_breakdown"),
        recommendation=ai_res.get("recommendation", "maybe")
    )
    db.add(resume_record)
    
    # Update candidate's resume score
    cand.resume_score = float(ai_res.get("score", 70))
    db.commit()

    user = db.query(User).filter(User.id == cand.user_id).first()
    return format_candidate(cand, user, job, db)


@router.post("/{id}/chat")
def chat_with_candidate(
    id: str,
    data: dict,
    db: Session = Depends(get_db)
):
    cand_id = parse_cand_id(id)
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    user_message = data.get("message")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required")

    # Determine Sentiment
    sentiment = ai_service.analyze_sentiment(user_message)

    # Save User message
    user_msg_record = ChatMessage(
        candidate_id=cand.id,
        role="user",
        message=user_message,
        sentiment=sentiment
    )
    db.add(user_msg_record)
    db.commit()

    # Get Chat History for Claude sliding window
    history_records = db.query(ChatMessage).filter(ChatMessage.candidate_id == cand.id).order_by(ChatMessage.created_at.asc()).all()
    history = [{"role": r.role, "message": r.message} for r in history_records]

    user = db.query(User).filter(User.id == cand.user_id).first()
    job = db.query(Job).filter(Job.id == cand.job_id).first()

    cand_info = {
        "name": user.full_name if user else "Candidate",
        "job_title": job.title if job else "Software Engineer"
    }

    # Call AI service for response
    try:
        bot_response = ai_service.get_chatbot_response(user_message, history, cand_info)
    except Exception:
        bot_response = "Thank you for sharing that. Can you tell me more about your experience with React and state management?"

    # Save bot message
    bot_msg_record = ChatMessage(
        candidate_id=cand.id,
        role="assistant",
        message=bot_response,
        sentiment="neutral"
    )
    db.add(bot_msg_record)
    
    # Slowly accumulate interview score based on chat length and negative sentiment checks
    negative_count = sum(1 for m in history_records if m.sentiment == "negative")
    raw_score = max(90 - (negative_count * 10) + len(history_records), 50)
    cand.interview_score = float(min(raw_score, 98))
    
    db.commit()

    return {
        "response": bot_response,
        "sentiment": sentiment
    }


@router.get("/{id}/chat-history")
def get_chat_history(
    id: str,
    db: Session = Depends(get_db)
):
    cand_id = parse_cand_id(id)
    records = db.query(ChatMessage).filter(ChatMessage.candidate_id == cand_id).order_by(ChatMessage.created_at.asc()).all()
    return [{
        "id": r.id,
        "role": r.role,
        "message": r.message,
        "sentiment": r.sentiment,
        "date": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for r in records]
