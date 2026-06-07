from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class UserRole(str, enum.Enum):
    hr        = "HR"
    admin     = "Admin"
    team_lead = "Team Lead"
    employee  = "Employee"
    candidate = "Candidate"


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String(255), unique=True, index=True, nullable=False)
    username      = Column(String(100), unique=True, index=True, nullable=True)
    full_name     = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)   # nullable for OAuth users
    role          = Column(String(50), default="Employee", nullable=False)
    is_active     = Column(Boolean, default=True)
    photo_url     = Column(String(500), nullable=True)
    provider      = Column(String(20), nullable=True)
    firebase_uid  = Column(String(255), unique=True, nullable=True)
    college       = Column(String(255), nullable=True)
    phone         = Column(String(20), nullable=True)
    gender        = Column(String(50), nullable=True)
    year_of_passing = Column(String(50), nullable=True)
    
    # Phase 2 Profile Fields
    tagline       = Column(String(255), nullable=True)
    designation   = Column(String(100), nullable=True)
    company       = Column(String(100), nullable=True)
    department    = Column(String(100), nullable=True)
    location      = Column(String(100), nullable=True)
    bio           = Column(String(300), nullable=True)
    status        = Column(String(30), nullable=True)
    degree        = Column(String(100), nullable=True)
    branch        = Column(String(100), nullable=True)
    grad_year     = Column(Integer, nullable=True)
    experience_years = Column(Float, default=0.0)
    
    # Premium & Onboarding
    is_premium    = Column(Boolean, default=False)
    premium_plan  = Column(String(20), nullable=True)
    onboarding_complete = Column(Boolean, default=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    last_login    = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    social_profiles = relationship("SocialProfile", back_populates="user", cascade="all, delete-orphan")
    applications    = relationship("Candidate", back_populates="user", cascade="all, delete-orphan")


class SocialProfile(Base):
    __tablename__ = "social_profiles"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    platform    = Column(String(50), nullable=False)   # github, leetcode, codeforces
    username    = Column(String(255), nullable=False)
    profile_url = Column(String(500), nullable=True)
    data        = Column(JSON, nullable=True)           # raw API response
    portfolio_score = Column(Float, default=0.0)
    synced_at   = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="social_profiles")
