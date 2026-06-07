from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Database and models imports to ensure they register on Base.metadata
from app.db.database import Base, engine
from app.models.user import User, SocialProfile
from app.models.hr import (
    Job, Candidate, Resume, ChatMessage, Employee,
    PerformanceRecord, Payroll, Team, TeamUpdate,
    Complaint, LeaveRequest, SystemSettings, CandidateNote
)
from app.models.interview import InterviewSession, InterviewQuestion

# Route imports
from app.api.routes import (
    auth, employees, jobs, candidates, teams,
    complaints, leaves, payroll, settings, social, analytics,
    ats, interview, search
)
from app.core.config import settings as app_settings


def init_db():
    """Create all tables and seed if empty."""
    Base.metadata.create_all(bind=engine)

    # Run safe migrations for new columns
    from app.db.database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # PostgreSQL support: ADD COLUMN IF NOT EXISTS
        # SQLite support: ADD COLUMN (will raise exception if already exists, which we catch and bypass)
        is_sqlite = db.bind.name == "sqlite"
        
        # User columns (Phase 2 & beyond)
        user_columns = {
            "gender": "VARCHAR(500)",
            "year_of_passing": "VARCHAR(500)",
            "photo_url": "VARCHAR(500)",
            "provider": "VARCHAR(20)",
            "tagline": "VARCHAR(255)",
            "designation": "VARCHAR(100)",
            "company": "VARCHAR(100)",
            "department": "VARCHAR(100)",
            "location": "VARCHAR(100)",
            "bio": "VARCHAR(300)",
            "status": "VARCHAR(30)",
            "college": "VARCHAR(255)",
            "degree": "VARCHAR(100)",
            "branch": "VARCHAR(100)",
            "grad_year": "INTEGER",
            "experience_years": "FLOAT DEFAULT 0",
            "is_premium": "BOOLEAN DEFAULT FALSE",
            "premium_plan": "VARCHAR(20)",
            "onboarding_complete": "BOOLEAN DEFAULT FALSE"
        }
        for col_name, col_type in user_columns.items():
            try:
                if is_sqlite:
                    db.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"))
                else:
                    db.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                db.commit()
            except Exception:
                db.rollback()

        # Resumes table columns
        try:
            if is_sqlite:
                db.execute(text("ALTER TABLE resumes ADD COLUMN breakdown JSON;"))
            else:
                db.execute(text("ALTER TABLE resumes ADD COLUMN IF NOT EXISTS breakdown JSON;"))
            db.commit()
        except Exception:
            db.rollback()

        # Job columns
        job_columns = {
            "max_applications": "INTEGER",
            "current_applications": "INTEGER DEFAULT 0",
            "ats_reject_threshold": "INTEGER",
            "ats_advance_threshold": "INTEGER",
            "interview_type": "VARCHAR(20)",
            "interview_questions": "INTEGER",
            "interview_time_limit": "INTEGER",
            "score_weight_ats": "FLOAT",
            "score_weight_video": "FLOAT",
            "score_weight_portfolio": "FLOAT",
            "is_open": "BOOLEAN DEFAULT TRUE",
            "deadline": "TIMESTAMP"
        }
        for col_name, col_type in job_columns.items():
            try:
                if is_sqlite:
                    db.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type};"))
                else:
                    db.execute(text(f"ALTER TABLE jobs ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                db.commit()
            except Exception:
                db.rollback()

        # Migrate system_settings table
        try:
            if is_sqlite:
                db.execute(text("ALTER TABLE system_settings ADD COLUMN max_applications_per_candidate INTEGER DEFAULT 1;"))
            else:
                db.execute(text("ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS max_applications_per_candidate INTEGER DEFAULT 1;"))
            db.commit()
        except Exception:
            db.rollback()
    except Exception as e:
        print(f"⚠️ Migration failed: {e}")

    # Auto-seed demo data on first run or if HR user is missing
    try:
        from app.models.user import User as UserModel
        hr_user_exists = db.query(UserModel).filter(UserModel.email == "hr@enterprise.com").first() is not None
        if not hr_user_exists:
            print("🌱 HR user missing detected — running seed script...")
            import sys
            import os
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")
            from seed import seed
            seed()
        db.close()
    except Exception as e:
        db.close()
        print(f"⚠️  Auto-seed skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks before accepting requests."""
    init_db()
    yield


app = FastAPI(
    title=app_settings.APP_NAME,
    version=app_settings.APP_VERSION,
    debug=app_settings.DEBUG,
    lifespan=lifespan
)

# Mount static folder for interview recordings
from fastapi.staticfiles import StaticFiles
import os
static_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(static_path, "recordings"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        app_settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(auth.router,       prefix="/api/auth",       tags=["auth"])
app.include_router(employees.router,  prefix="/api/employees",  tags=["employees"])
app.include_router(jobs.router,       prefix="/api/jobs",       tags=["jobs"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])
app.include_router(teams.router,      prefix="/api/teams",      tags=["teams"])
app.include_router(complaints.router, prefix="/api/complaints", tags=["complaints"])
app.include_router(leaves.router,     prefix="/api/leaves",     tags=["leaves"])
app.include_router(payroll.router,    prefix="/api/payroll",    tags=["payroll"])
app.include_router(settings.router,   prefix="/api/settings",   tags=["settings"])
app.include_router(social.router,     prefix="/api/social",     tags=["social"])
app.include_router(analytics.router,  prefix="/api/analytics",  tags=["analytics"])
app.include_router(ats.router,        prefix="/api/ats",        tags=["ats"])
app.include_router(interview.router,  prefix="/api/interview",  tags=["interview"])
app.include_router(search.router,     prefix="/api/search",     tags=["search"])


@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": app_settings.APP_NAME,
        "version": app_settings.APP_VERSION,
        "docs": "/docs"
    }
