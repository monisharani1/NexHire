from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserRegister, UserLogin, TokenResponse, RefreshRequest, UserOut, SocialLoginRequest, UserUpdate
from app.services import auth_service
from app.models.user import User
# pyrefly: ignore [missing-import]
import firebase_admin
# pyrefly: ignore [missing-import]
from firebase_admin import auth as firebase_auth
from app.core.config import settings

# Initialize Firebase Admin once
if settings.FIREBASE_KEY_PATH:
    try:
        import os
        if os.path.exists(settings.FIREBASE_KEY_PATH):
            cred = firebase_admin.credentials.Certificate(settings.FIREBASE_KEY_PATH)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin initialized.")
        else:
            print(f"⚠️ Firebase key file not found at {settings.FIREBASE_KEY_PATH}")
    except ValueError:
        pass # Already initialized

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    return auth_service.register_user(db, data)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    return auth_service.login_user(db, data)


@router.post("/social/google")
async def google_login(data: SocialLoginRequest, db: Session = Depends(get_db)):
    try:
        decoded = firebase_auth.verify_id_token(data.firebase_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {e}")

    return await auth_service.handle_social_login(
        db=db,
        firebase_uid=decoded["uid"],
        email=decoded.get("email"),
        name=decoded.get("name"),
        photo_url=decoded.get("picture"),
        provider="google",
        github_token=None
    )


@router.post("/social/github")
async def github_login(data: SocialLoginRequest, db: Session = Depends(get_db)):
    try:
        decoded = firebase_auth.verify_id_token(data.firebase_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {e}")

    return await auth_service.handle_social_login(
        db=db,
        firebase_uid=decoded["uid"],
        email=decoded.get("email"),
        name=decoded.get("name"),
        photo_url=decoded.get("picture"),
        provider="github",
        github_token=data.github_access_token
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest):
    return auth_service.refresh_tokens(data.refresh_token)


@router.post("/logout")
def logout(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    # Strip Bearer prefix
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token header format")
    token = authorization.split(" ")[1]
    
    try:
        current_user = auth_service.get_current_user(token, db)
        auth_service.logout_user(current_user.id, token)
        return {"detail": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserOut)
def get_me(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token header format")
    token = authorization.split(" ")[1]
    return auth_service.get_current_user(token, db)


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token header format")
    token = authorization.split(" ")[1]
    current_user = auth_service.get_current_user(token, db)

    # Update profile fields
    update_fields = [
        "full_name", "username", "college", "phone", "gender", "year_of_passing",
        "tagline", "designation", "company", "department", "location", "bio",
        "status", "degree", "branch", "grad_year", "experience_years", "onboarding_complete"
    ]
    for field in update_fields:
        val = getattr(data, field, None)
        if val is not None:
            setattr(current_user, field, val)

    db.commit()
    db.refresh(current_user)
    return current_user
