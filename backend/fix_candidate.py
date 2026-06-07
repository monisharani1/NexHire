from app.db.database import SessionLocal
from app.models.user import User
from app.models.hr import Candidate, CandidateStatus, Job

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == "candidate@enterprise.com").first()
    if not user:
        print("❌ Candidate user 'candidate@enterprise.com' not found in DB.")
        exit(1)
        
    job = db.query(Job).filter(Job.is_active == True).first()
    if not job:
        print("❌ Active job not found in DB.")
        exit(1)

    cand = db.query(Candidate).filter(Candidate.user_id == user.id).first()
    if not cand:
        cand = Candidate(
            user_id=user.id,
            job_id=job.id,
            status=CandidateStatus.interviewed,
            resume_score=75.0,
            portfolio_score=0.0,
            interview_score=0.0
        )
        db.add(cand)
        print("✅ Created Candidate database record for Candidate Vance.")
    else:
        cand.status = CandidateStatus.interviewed
        cand.interview_score = 0.0
        print("✅ Updated Candidate record stage to 'interviewing' for Candidate Vance.")
    
    db.commit()
    print("🚀 Successfully authorized Candidate Vance to start the AI video interview!")
finally:
    db.close()
