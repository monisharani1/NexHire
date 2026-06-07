from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class InterviewCreate(BaseModel):
    candidate_id: int
    job_id: int


class InterviewAnswerSubmit(BaseModel):
    session_uuid: str
    question_index: int
    answer_text: str
    duration: Optional[float] = None  # in seconds, to calculate WPM if needed
    filler_count: Optional[int] = None
    wpm: Optional[float] = None
    sentiment: Optional[str] = None


class InterviewQuestionOut(BaseModel):
    id: int
    question_index: int
    question_text: str
    answer_text: Optional[str] = None
    answer_score: Optional[float] = None
    answer_feedback: Optional[str] = None
    filler_count: int
    wpm: float
    sentiment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewSessionOut(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    session_uuid: str
    status: str
    recording_url: Optional[str] = None
    transcript: List[Dict[str, Any]] = []
    ai_report: Optional[Dict[str, Any]] = None
    overall_score: Optional[float] = None
    confidence_score: Optional[float] = None
    communication_score: Optional[float] = None
    technical_accuracy_score: Optional[float] = None
    hire_recommendation: Optional[str] = None
    hr_override_score: Optional[float] = None
    override_reason: Optional[str] = None
    overridden_by: Optional[int] = None
    overridden_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    created_at: datetime
    questions: List[InterviewQuestionOut] = []

    class Config:
        from_attributes = True


class InterviewOverrideSubmit(BaseModel):
    hr_score: float
    reason: str
