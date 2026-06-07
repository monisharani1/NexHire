from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.hr import SystemSettings
from app.services import auth_service

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return auth_service.get_current_user(token, db)


def format_settings(s: SystemSettings):
    return {
        "aiMinAtsScore": s.ai_min_ats_score,
        "aiAutoShortlistThreshold": s.ai_auto_shortlist_threshold,
        "enableEyeContactTracking": s.enable_eye_contact_tracking,
        "enableSentimentAlerts": s.enable_sentiment_alerts,
        "notificationEmail": s.notification_email,
        "maxApplicationsPerCandidate": getattr(s, "max_applications_per_candidate", 1)
    }


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).first()
    if not settings:
        settings = SystemSettings(
            ai_min_ats_score=70,
            ai_auto_shortlist_threshold=85,
            enable_eye_contact_tracking=True,
            enable_sentiment_alerts=True,
            notification_email="hr-alerts@enterprise.com",
            max_applications_per_candidate=1
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return format_settings(settings)


@router.put("")
def update_settings(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    settings = db.query(SystemSettings).first()
    if not settings:
        settings = SystemSettings()
        db.add(settings)

    if "aiMinAtsScore" in data:
         settings.ai_min_ats_score = int(data["aiMinAtsScore"])
    if "aiAutoShortlistThreshold" in data:
         settings.ai_auto_shortlist_threshold = int(data["aiAutoShortlistThreshold"])
    if "enableEyeContactTracking" in data:
         settings.enable_eye_contact_tracking = bool(data["enableEyeContactTracking"])
    if "enableSentimentAlerts" in data:
         settings.enable_sentiment_alerts = bool(data["enableSentimentAlerts"])
    if "notificationEmail" in data:
         settings.notification_email = str(data["notificationEmail"])
    if "maxApplicationsPerCandidate" in data:
         settings.max_applications_per_candidate = int(data["maxApplicationsPerCandidate"])

    db.commit()
    db.refresh(settings)
    return format_settings(settings)
