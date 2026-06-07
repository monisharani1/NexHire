from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime

# Roles that match the frontend exactly
UserRoleLiteral = Literal["HR", "Admin", "Team Lead", "Employee", "Candidate"]


# ── Auth Schemas ──────────────────────────────────────────────

class UserRegister(BaseModel):
    email:     EmailStr
    password:  str
    full_name: str
    role:      UserRoleLiteral = "Employee"
    college:   Optional[str] = None
    phone:     Optional[str] = None


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class SocialLoginRequest(BaseModel):
    firebase_token: str
    github_access_token: Optional[str] = None


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    role:          str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User Schemas ──────────────────────────────────────────────

class UserOut(BaseModel):
    id:         int
    email:      str
    full_name:  Optional[str]
    username:   Optional[str]
    role:       str
    college:    Optional[str]
    phone:      Optional[str]
    gender:     Optional[str]
    year_of_passing: Optional[str]
    
    # Phase 2
    tagline:       Optional[str] = None
    designation:   Optional[str] = None
    company:       Optional[str] = None
    department:    Optional[str] = None
    location:      Optional[str] = None
    bio:           Optional[str] = None
    status:        Optional[str] = None
    degree:        Optional[str] = None
    branch:        Optional[str] = None
    grad_year:     Optional[int] = None
    experience_years: Optional[float] = None
    is_premium:    Optional[bool] = None
    premium_plan:  Optional[str] = None
    onboarding_complete: Optional[bool] = None
    
    is_active:  bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username:  Optional[str] = None
    college:   Optional[str] = None
    phone:     Optional[str] = None
    gender:    Optional[str] = None
    year_of_passing: Optional[str] = None
    
    # Phase 2
    tagline:       Optional[str] = None
    designation:   Optional[str] = None
    company:       Optional[str] = None
    department:    Optional[str] = None
    location:      Optional[str] = None
    bio:           Optional[str] = None
    status:        Optional[str] = None
    degree:        Optional[str] = None
    branch:        Optional[str] = None
    grad_year:     Optional[int] = None
    experience_years: Optional[float] = None
    onboarding_complete: Optional[bool] = None


# ── Social Profile Schemas ────────────────────────────────────

class SocialProfileConnect(BaseModel):
    platform: str   # github, leetcode, codeforces
    username: str


class SocialProfileOut(BaseModel):
    id:              int
    platform:        str
    username:        str
    portfolio_score: float
    synced_at:       Optional[datetime]

    class Config:
        from_attributes = True


class PortfolioOut(BaseModel):
    user_id:      int
    overall_score: float
    profiles:     dict
    achievements: list
    top_projects: list
