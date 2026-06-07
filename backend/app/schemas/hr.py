from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.hr import CandidateStatus, PayrollStatus


# ── Job Schemas ───────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str] = []


class JobOut(BaseModel):
    id: int
    title: str
    description: str
    required_skills: List[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Resume Schemas ────────────────────────────────────────────

class ResumeScreenRequest(BaseModel):
    resume_text: str
    job_id: int


class ResumeScreenResponse(BaseModel):
    score: int
    strengths: List[str]
    gaps: List[str]
    recommendation: str   # hire, maybe, reject


# ── Chat Schemas ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    candidate_id: int
    message: str


class ChatResponse(BaseModel):
    response: str
    sentiment: str


class ChatMessageOut(BaseModel):
    id: int
    role: str
    message: str
    sentiment: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Candidate Schemas ─────────────────────────────────────────

class CandidateOut(BaseModel):
    id: int
    user_id: int
    job_id: int
    status: str
    resume_score: Optional[float]
    portfolio_score: Optional[float]
    interview_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Employee Schemas ──────────────────────────────────────────

class EmployeeCreate(BaseModel):
    user_id: int
    department: Optional[str] = None
    designation: Optional[str] = None
    salary: Optional[float] = None
    manager_id: Optional[int] = None


class EmployeeOut(BaseModel):
    id: int
    user_id: int
    department: Optional[str]
    designation: Optional[str]
    salary: Optional[float]
    is_active: bool

    class Config:
        from_attributes = True


# ── Performance Schemas ───────────────────────────────────────

class PerformanceInsightOut(BaseModel):
    employee_id: int
    summary: str
    flags: List[str]
    metrics: dict
    trends: dict


# ── Payroll Schemas ───────────────────────────────────────────

class PayrollRecommendationOut(BaseModel):
    employee_id: int
    current_salary: float
    recommended_adjustment: str
    reasoning: str
    components: dict


# ── Team Schemas ───────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str
    lead_id: Optional[int] = None
    members: List[int] = []
    progress: float = 0.0
    description: Optional[str] = None


class TeamUpdateSchema(BaseModel):
    name: Optional[str] = None
    lead_id: Optional[int] = None
    members: Optional[List[int]] = None
    progress: Optional[float] = None
    description: Optional[str] = None


class TeamOut(BaseModel):
    id: int
    name: str
    lead_id: Optional[int]
    lead_name: Optional[str] = None
    members: List[int]
    progress: float
    delay_risk: str
    description: Optional[str]
    productivity_score: float

    class Config:
        from_attributes = True


# ── Team Update Schemas ─────────────────────────────────────────

class TeamUpdateCreate(BaseModel):
    team_id: int
    content: str
    progress: float
    blockers: List[str] = []


class TeamUpdateOut(BaseModel):
    id: int
    team_id: int
    team_name: Optional[str] = None
    date: str
    content: str
    progress: float
    blockers: List[str]
    risk_level: str
    ai_summary: Optional[str]

    class Config:
        from_attributes = True


# ── Complaint Schemas ───────────────────────────────────────────

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    is_anonymous: bool = False
    submitted_by: str


class ComplaintOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    is_anonymous: bool
    submitted_by: str
    status: str
    priority: str
    sentiment: str
    date: str

    class Config:
        from_attributes = True


# ── Leave Request Schemas ───────────────────────────────────────

class LeaveRequestCreate(BaseModel):
    employee_id: int
    type: str
    start_date: str
    end_date: str
    reason: str


class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    type: str
    start_date: str
    end_date: str
    status: str
    reason: str
    ai_action: str
    ai_message: Optional[str]

    class Config:
        from_attributes = True


# ── System Settings Schemas ─────────────────────────────────────

class SettingsSchema(BaseModel):
    ai_min_ats_score: int
    ai_auto_shortlist_threshold: int
    enable_eye_contact_tracking: bool
    enable_sentiment_alerts: bool
    notification_email: str
    max_applications_per_candidate: int

    class Config:
        from_attributes = True

