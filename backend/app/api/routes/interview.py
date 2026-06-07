from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import re

from app.db.database import get_db
from app.models.user import User
from app.models.hr import Candidate, Job, CandidateStatus
from app.models.interview import InterviewSession, InterviewQuestion
from app.services import interview_service, storage_service, ai_service, tts_service
from app.services.auth_service import get_current_user
from app.schemas.interview import InterviewCreate, InterviewAnswerSubmit, InterviewOverrideSubmit

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return get_current_user(token, db)


def parse_cand_id(id_str: str) -> int:
    if isinstance(id_str, int):
        return id_str
    if id_str.startswith("cand-"):
        return int(id_str.split("-")[1])
    try:
        return int(id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")


@router.post("/audio")
def process_audio(
    audio: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    from app.services import stt_service
    file_bytes = audio.file.read()
    transcribed_text = stt_service.transcribe_audio(file_bytes, audio.filename)
    return {"text": transcribed_text}


@router.post("/tts")
def generate_speech(
    data: Dict[str, str],
    db: Session = Depends(get_db)
):
    text = data.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text required")
        
    audio_bytes = tts_service.synthesize_speech(text)
    if not audio_bytes:
        # Fall back gracefully without an error log
        return Response(status_code=204)
        
    return Response(content=audio_bytes, media_type="audio/mpeg")


@router.post("/create")
def create_interview_session(
    data: InterviewCreate,
    db: Session = Depends(get_db)
):
    cand_id = parse_cand_id(str(data.candidate_id))
    cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = db.query(Job).filter(Job.id == data.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Clear any existing sessions for this candidate and job to allow re-taking
    existing = db.query(InterviewSession).filter(
        InterviewSession.candidate_id == cand.id,
        InterviewSession.job_id == job.id
    ).all()
    for s in existing:
        db.delete(s)
    db.commit()

    # Create new interview session
    session = InterviewSession(
        candidate_id=cand.id,
        job_id=job.id,
        status="pending",
        transcript=[]
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Pre-generate 5 questions based on job details
    questions_list = interview_service.generate_initial_questions(job.title, job.description)
    
    saved_questions = []
    for idx, q_text in enumerate(questions_list):
        q = InterviewQuestion(
            session_id=session.id,
            question_index=idx,
            question_text=q_text,
            filler_count=0,
            wpm=0.0
        )
        db.add(q)
        saved_questions.append(q)
    
    session.started_at = datetime.now(timezone.utc)
    session.status = "in_progress"
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"⚠️ Caught concurrent session update race condition: {e}")

    return {
        "session_id": session.session_uuid,
        "questions": [q.question_text for q in saved_questions]
    }


@router.get("/session/{session_uuid}")
def get_interview_session(
    session_uuid: str,
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.session_uuid == session_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session.id).order_by(InterviewQuestion.question_index.asc()).all()

    return {
        "id": session.id,
        "session_uuid": session.session_uuid,
        "candidate_id": session.candidate_id,
        "job_id": session.job_id,
        "status": session.status,
        "recording_url": session.recording_url,
        "transcript": session.transcript,
        "questions": [
            {
                "index": q.question_index,
                "question": q.question_text,
                "answer": q.answer_text,
                "filler_count": q.filler_count,
                "wpm": q.wpm,
                "sentiment": q.sentiment
            } for q in questions
        ]
    }


@router.post("/answer")
def submit_answer(
    data: InterviewAnswerSubmit,
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.session_uuid == data.session_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    job = db.query(Job).filter(Job.id == session.job_id).first()
    
    # Locate target question
    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id,
        InterviewQuestion.question_index == data.question_index
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question index not found in session")

    # Heuristic metrics calculation
    answer_text = data.answer_text.strip()
    words = len(answer_text.split())
    
    # Calculate filler words: count "um", "uh", "like", "you know"
    fillers = ["um", "uh", "like", "you know"]
    filler_count = 0
    ans_lower = answer_text.lower()
    for f in fillers:
        filler_count += len(re.findall(r'\b' + re.escape(f) + r'\b', ans_lower))

    # WPM
    wpm_val = data.wpm
    if not wpm_val and data.duration:
        wpm_val = (words / data.duration) * 60.0
    if not wpm_val or wpm_val <= 0:
        wpm_val = 135.0  # reasonable average fallback

    # Sentiment
    sentiment = data.sentiment or ai_service.analyze_sentiment(answer_text)

    # 1. State: Checking if they are answering the main question or the follow-up
    if not question.answer_text:
        # Saving answer to the main question
        question.answer_text = answer_text
        question.filler_count = filler_count
        question.wpm = float(wpm_val)
        question.sentiment = sentiment
        
        # Append main Q&A exchanges to session transcript
        transcript = list(session.transcript) if session.transcript else []
        transcript.append({"role": "ai", "text": question.question_text})
        transcript.append({"role": "candidate", "text": answer_text})
        session.transcript = transcript
        db.commit()

        # Generate follow-up question
        try:
            follow_up = interview_service.generate_follow_up(
                job.title if job else "Software Engineer",
                job.description if job else "",
                transcript,
                answer_text
            )
        except Exception:
            follow_up = "That's an interesting point. Can you elaborate further on how you applied that in a team project?"

        # Append follow-up question to transcript so it's logged
        transcript.append({"role": "ai_followup", "text": follow_up})
        session.transcript = transcript
        db.commit()

        return {
            "next_question": None,
            "follow_up": follow_up
        }
    else:
        # Answering the follow-up question
        transcript = list(session.transcript) if session.transcript else []
        transcript.append({"role": "candidate_followup", "text": answer_text})
        session.transcript = transcript
        db.commit()

        # Find next question
        next_idx = data.question_index + 1
        next_q = db.query(InterviewQuestion).filter(
            InterviewQuestion.session_id == session.id,
            InterviewQuestion.question_index == next_idx
        ).first()

        if next_q:
            # Generate a conversational segue
            try:
                next_text = interview_service.generate_transition(
                    transcript,
                    answer_text,
                    next_q.question_text
                )
            except Exception:
                next_text = f"Thank you. Moving on, {next_q.question_text}"

            return {
                "next_question": next_text,
                "follow_up": None
            }
        else:
            return {
                "next_question": "INTERVIEW_COMPLETE",
                "follow_up": None
            }


@router.post("/complete")
def complete_interview(
    data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    session_uuid = data.get("session_uuid") or data.get("session_id")
    if not session_uuid:
        raise HTTPException(status_code=400, detail="session_uuid is required")

    session = db.query(InterviewSession).filter(InterviewSession.session_uuid == session_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    job = db.query(Job).filter(Job.id == session.job_id).first()
    cand = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()

    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    if session.started_at:
        # Ensure both are offset-aware for safe subtraction
        started_dt = session.started_at
        if started_dt.tzinfo is None:
            started_dt = started_dt.replace(tzinfo=timezone.utc)
            
        duration = (session.completed_at - started_dt).total_seconds()
        session.duration_seconds = int(duration)

    # Gather metrics across all main questions
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session.id).all()
    
    total_wpm = 0.0
    total_fillers = 0
    total_words = 0
    sentiments = []
    
    for q in questions:
        total_wpm += q.wpm
        total_fillers += q.filler_count
        if q.answer_text:
            total_words += len(q.answer_text.split())
        if q.sentiment:
            sentiments.append(q.sentiment)

    avg_wpm = total_wpm / len(questions) if questions else 130.0
    avg_words = total_words / len(questions) if questions else 50
    
    # Check if candidate actually answered any questions
    answered_questions = [q for q in questions if q.answer_text and q.answer_text.strip() and q.answer_text.strip() != "Candidate gave no response." and q.answer_text.strip() != "Passed/skipped question."]
    
    if not answered_questions:
        # No real answers — don't inflate with fake scoring
        report = {
            "overall_score": 0,
            "confidence_score": 0,
            "communication_score": 0,
            "technical_accuracy_score": 0,
            "per_question_scores": [],
            "strengths": [],
            "weaknesses": ["Candidate did not provide answers to interview questions"],
            "overall_feedback": "The candidate did not answer any interview questions. No score can be assigned.",
            "hire_recommendation": "no",
            "confidence_flags": {
                "filler_words_count": 0,
                "avg_words_per_answer": 0,
                "speaking_pace": "none",
                "sentiment_trend": "neutral"
            }
        }
    else:
        # Run evaluation
        report = interview_service.score_interview(
            job_title=job.title if job else "Software Engineer",
            job_description=job.description if job else "",
            transcript=session.transcript,
            wpm=avg_wpm,
            filler_count=total_fillers,
            avg_words=int(avg_words),
            sentiment_list=sentiments
        )

    # Store scores
    session.ai_report = report
    session.overall_score = float(report.get("overall_score", 70))
    session.confidence_score = float(report.get("confidence_score", 70))
    session.communication_score = float(report.get("communication_score", 70))
    session.technical_accuracy_score = float(report.get("technical_accuracy_score", 70))
    session.hire_recommendation = report.get("hire_recommendation", "maybe")

    # Update Candidate table
    if cand:
        cand.interview_score = session.overall_score
        cand.status = CandidateStatus.interviewed
    
    db.commit()

    return {
        "status": "success",
        "report_id": session.id,
        "report": report
    }


@router.post("/upload-recording")
def upload_recording(
    video: UploadFile = File(...),
    session_id: str = Form(...),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.session_uuid == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    file_bytes = video.file.read()
    
    # Save the file (to cloud or local folder)
    recording_url = storage_service.save_recording(file_bytes, session_id)
    
    session.recording_url = recording_url
    db.commit()

    return {
        "status": "success",
        "recording_url": recording_url
    }


@router.get("/report/{session_uuid}")
def get_interview_report(
    session_uuid: str,
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.session_uuid == session_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Report not found")

    cand = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
    user = db.query(User).filter(User.id == cand.user_id).first() if cand else None
    job = db.query(Job).filter(Job.id == session.job_id).first()

    return {
        "candidate_name": user.full_name if user else "Candidate",
        "candidate_email": user.email if user else "",
        "job_title": job.title if job else "Software Engineer",
        "overall_score": session.overall_score,
        "confidence_score": session.confidence_score,
        "communication_score": session.communication_score,
        "technical_accuracy_score": session.technical_accuracy_score,
        "hire_recommendation": session.hire_recommendation,
        "recording_url": session.recording_url,
        "transcript": session.transcript,
        "ai_report": session.ai_report,
        "hr_override_score": session.hr_override_score,
        "override_reason": session.override_reason,
        "overridden_at": session.overridden_at,
        "completed_at": session.completed_at
    }


@router.get("/recording/{session_uuid}")
def get_recording_url(
    session_uuid: str,
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(InterviewSession.session_uuid == session_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    return {
        "recording_url": session.recording_url
    }


@router.put("/override/{session_uuid}")
def override_score(
    session_uuid: str,
    data: InterviewOverrideSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.role not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized role override")

    session = db.query(InterviewSession).filter(InterviewSession.session_uuid == session_uuid).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    session.hr_override_score = data.hr_score
    session.override_reason = data.reason
    session.overridden_by = current_user.id
    session.overridden_at = datetime.utcnow()

    # Update candidate final score
    cand = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
    if cand:
        cand.interview_score = data.hr_score
    
    db.commit()

    return {
        "status": "success",
        "hr_override_score": session.hr_override_score,
        "override_reason": session.override_reason
    }


@router.get("/list/{job_id}")
def get_interviews_list(
    job_id: int,
    db: Session = Depends(get_db)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.job_id == job_id,
        InterviewSession.status == "completed"
    ).all()

    results = []
    for s in sessions:
        cand = db.query(Candidate).filter(Candidate.id == s.candidate_id).first()
        user = db.query(User).filter(User.id == cand.user_id).first() if cand else None
        
        results.append({
            "session_uuid": s.session_uuid,
            "candidate_name": user.full_name if user else "Candidate",
            "email": user.email if user else "",
            "score": s.hr_override_score if s.hr_override_score is not None else s.overall_score,
            "original_score": s.overall_score,
            "confidence": s.confidence_score,
            "communication": s.communication_score,
            "technical": s.technical_accuracy_score,
            "recommendation": s.hire_recommendation,
            "overridden": s.hr_override_score is not None,
            "completed_at": s.completed_at
        })

    # Sort descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results
