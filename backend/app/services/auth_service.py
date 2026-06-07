"""
Auth service — JWT-based authentication without Redis.
Uses an in-memory set for token revocation (resets on server restart, fine for dev).
For production, swap the in-memory set with a database table or Redis.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime

from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenResponse
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.core.config import settings

# In-memory revocation set (token → 1). Cleared on server restart.
_revoked_tokens: set[str] = set()


# ── Register ──────────────────────────────────────────────────

def register_user(db: Session, data: UserRegister) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
        role=data.role,
        college=data.college,
        phone=data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Login ─────────────────────────────────────────────────────

def login_user(db: Session, data: UserLogin) -> TokenResponse:
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    # Update last login timestamp
    user.last_login = datetime.utcnow()
    db.commit()

    # Create tokens — role stored as plain string
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role
    )


# ── Refresh ───────────────────────────────────────────────────

def refresh_tokens(refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if refresh_token in _revoked_tokens:
        raise HTTPException(status_code=401, detail="Token revoked")

    token_data = {
        "sub": payload["sub"],
        "email": payload["email"],
        "role": payload["role"]
    }
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        role=payload["role"]
    )


# ── Logout ────────────────────────────────────────────────────

def logout_user(user_id: int, token: str):
    """Revoke the token by adding it to the in-memory set."""
    _revoked_tokens.add(token)


# ── Get Current User ──────────────────────────────────────────

def get_current_user(token: str, db: Session) -> User:
    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if token in _revoked_tokens:
        raise HTTPException(status_code=401, detail="Token has been revoked")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user


# ── RBAC Dependency ───────────────────────────────────────────

def require_role(*roles: str):
    """
    FastAPI dependency factory for role-based access control.
    Usage: current_user: User = Depends(require_role("HR", "Admin"))
    """
    def checker(current_user: User):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        return current_user
    return checker


async def handle_social_login(
    db: Session, firebase_uid: str, email: str, name: str, photo_url: str, provider: str, github_token: str = None
) -> dict:
    """
    Handles both Google and GitHub social logins.
    Creates user if new, returns JWT if existing.
    """
    from app.models.user import User, SocialProfile, UserRole
    from app.core.security import create_access_token, create_refresh_token
    import httpx

    # 1. Look up user
    user = db.query(User).filter(
        (User.firebase_uid == firebase_uid) | (User.email == email)
    ).first()

    is_new_user = False

    if not user:
        # New user - create account
        user = User(
            email=email,
            full_name=name,
            firebase_uid=firebase_uid,
            provider=provider,
            photo_url=photo_url,
            role=UserRole.candidate,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
    else:
        # Check role restriction
        if user.role not in [UserRole.candidate, "Candidate"]:
            raise HTTPException(
                status_code=400,
                detail="Social Login is restricted to Job Candidates. Corporate accounts must sign in using company credentials."
            )
        # Existing user - update firebase_uid and provider if missing
        if not user.firebase_uid:
            user.firebase_uid = firebase_uid
            user.provider = provider
        user.last_login = datetime.utcnow()
        db.commit()

    # 2. Auto-connect GitHub profile if token provided
    if provider == "github" and github_token:
        await sync_github_on_login(db, user.id, github_token)

    # 3. Generate NexHire JWT
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "is_new_user": is_new_user,
        "name": user.full_name,
        "photo": user.photo_url,
    }

async def sync_github_on_login(db: Session, user_id: int, github_token: str):
    """
    Auto-sync GitHub profile when user logs in with GitHub.
    """
    from app.models.user import SocialProfile
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {github_token}"}
        )
        if response.status_code != 200:
            return  # silently fail, don't block login

        github_data = response.json()

        # Check if GitHub profile already exists
        profile = db.query(SocialProfile).filter(
            SocialProfile.user_id == user_id,
            SocialProfile.platform == "github"
        ).first()

        if not profile:
            profile = SocialProfile(
                user_id=user_id,
                platform="github",
                username=github_data.get("login"),
            )
            db.add(profile)

        profile.data = github_data
        profile.synced_at = datetime.utcnow()
        db.commit()
