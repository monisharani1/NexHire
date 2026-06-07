import enum
import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), index=True, nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), index=True, nullable=False)
    session_uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    status = Column(String(20), default="pending")  # 'pending', 'in_progress', 'completed', 'failed', 'expired'
    recording_url = Column(Text, nullable=True)
    transcript = Column(JSON, default=list)  # List of message objects
    ai_report = Column(JSON, nullable=True)  # Full report object

    overall_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    technical_accuracy_score = Column(Float, nullable=True)
    hire_recommendation = Column(String(20), nullable=True)  # 'strong_yes', 'yes', 'maybe', 'no'

    # HR Override fields
    hr_override_score = Column(Float, nullable=True)
    override_reason = Column(Text, nullable=True)
    overridden_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    overridden_at = Column(DateTime(timezone=True), nullable=True)

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    candidate = relationship("Candidate")
    job = relationship("Job")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    answer_score = Column(Float, nullable=True)
    answer_feedback = Column(Text, nullable=True)
    filler_count = Column(Integer, default=0)
    wpm = Column(Float, default=0.0)
    sentiment = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="questions")
