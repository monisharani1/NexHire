from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, Float, ForeignKey, JSON, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class CandidateStatus(str, enum.Enum):
    applied = "applied"
    screening = "screening"
    interviewed = "interviewed"
    offered = "offered"
    rejected = "rejected"


class PayrollStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"
    paid = "paid"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # HR Configurations
    max_applications = Column(Integer, nullable=True)
    current_applications = Column(Integer, default=0)
    ats_reject_threshold = Column(Integer, nullable=True)
    ats_advance_threshold = Column(Integer, nullable=True)
    interview_type = Column(String(20), nullable=True)
    interview_questions = Column(Integer, nullable=True)
    interview_time_limit = Column(Integer, nullable=True)
    score_weight_ats = Column(Float, nullable=True)
    score_weight_video = Column(Float, nullable=True)
    score_weight_portfolio = Column(Float, nullable=True)
    is_open = Column(Boolean, default=True)
    deadline = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    candidates = relationship("Candidate", back_populates="job")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), index=True, nullable=False)
    status = Column(Enum(CandidateStatus), default=CandidateStatus.applied)
    resume_score = Column(Float, nullable=True)
    portfolio_score = Column(Float, nullable=True)
    interview_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="candidates")
    resumes = relationship("Resume", back_populates="candidate")
    chat_messages = relationship("ChatMessage", back_populates="candidate")
    notes = relationship("CandidateNote", back_populates="candidate", cascade="all, delete-orphan")


class CandidateNote(Base):
    __tablename__ = "candidate_notes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), index=True, nullable=False)
    hr_user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    candidate = relationship("Candidate", back_populates="notes")
    hr_user = relationship("User")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), index=True)
    file_path = Column(String(500), nullable=True)
    extracted_text = Column(Text, nullable=True)
    score = Column(Integer, nullable=True)
    strengths = Column(JSON, default=list)
    gaps = Column(JSON, default=list)
    breakdown = Column(JSON, nullable=True)
    recommendation = Column(String(20), nullable=True)   # hire, maybe, reject
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    candidate = relationship("Candidate", back_populates="resumes")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), index=True)
    role = Column(String(20), nullable=False)            # user / assistant
    message = Column(Text, nullable=False)
    sentiment = Column(String(20), default="neutral")    # positive, neutral, negative
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    candidate = relationship("Candidate", back_populates="chat_messages")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    salary = Column(Float, nullable=True)
    joining_date = Column(DateTime(timezone=True), nullable=True)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    performance_records = relationship("PerformanceRecord", back_populates="employee")
    payroll_records = relationship("Payroll", back_populates="employee")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    led_teams = relationship("Team", back_populates="lead", foreign_keys="[Team.lead_id]")


class PerformanceRecord(Base):
    __tablename__ = "performance_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True)
    metric = Column(String(100), nullable=False)   # attendance, rating, projects
    value = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    employee = relationship("Employee", back_populates="performance_records")


class Payroll(Base):
    __tablename__ = "payroll"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), index=True)
    month = Column(String(20), nullable=False)     # e.g. "2025-06"
    base_salary = Column(Float, nullable=False)
    deductions = Column(Float, default=0.0)
    net_salary = Column(Float, nullable=False)
    adjustment_percentage = Column(Float, default=0.0)
    adjustment_reason = Column(Text, nullable=True)
    status = Column(Enum(PayrollStatus), default=PayrollStatus.pending)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    employee = relationship("Employee", back_populates="payroll_records")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    lead_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    members = Column(JSON, default=list)  # List of employee IDs e.g. ["emp-3", "emp-5"]
    progress = Column(Float, default=0.0)
    delay_risk = Column(String(50), default="low")  # low, medium, high
    description = Column(Text, nullable=True)
    productivity_score = Column(Float, default=0.0)

    lead = relationship("Employee", back_populates="led_teams", foreign_keys=[lead_id])
    updates = relationship("TeamUpdate", back_populates="team", cascade="all, delete-orphan")


class TeamUpdate(Base):
    __tablename__ = "team_updates"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    date = Column(String(50), nullable=False)  # e.g. "2026-06-03"
    content = Column(Text, nullable=False)
    progress = Column(Float, default=0.0)
    blockers = Column(JSON, default=list)  # List of strings
    risk_level = Column(String(50), default="low")
    ai_summary = Column(Text, nullable=True)

    team = relationship("Team", back_populates="updates")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # workplace, harassment, workload, benefits, other
    is_anonymous = Column(Boolean, default=False)
    submitted_by = Column(String(255), nullable=False)
    status = Column(String(50), default="pending")  # pending, resolved
    priority = Column(String(50), default="medium")  # low, medium, high
    sentiment = Column(String(50), default="neutral")  # positive, neutral, negative
    date = Column(String(50), nullable=False)  # e.g. "2026-06-02"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    type = Column(String(50), nullable=False)  # annual, sick, unpaid, parental
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=False)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    reason = Column(Text, nullable=False)
    ai_action = Column(String(50), default="approve")  # approve, caution
    ai_message = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="leave_requests")


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    ai_min_ats_score = Column(Integer, default=70)
    ai_auto_shortlist_threshold = Column(Integer, default=85)
    enable_eye_contact_tracking = Column(Boolean, default=True)
    enable_sentiment_alerts = Column(Boolean, default=True)
    notification_email = Column(String(255), default="hr-alerts@enterprise.com")
    max_applications_per_candidate = Column(Integer, default=1, nullable=False)

