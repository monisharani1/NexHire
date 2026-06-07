from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
import httpx
import random

from app.db.database import get_db
from app.models.user import User
from app.models.hr import Candidate
from app.models.user import SocialProfile
from app.services import auth_service

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return auth_service.get_current_user(token, db)


def calculate_github_score(data: dict) -> float:
    # github_score = repos * 5 + stars * 2 + language_diversity * 10 + contributions_year * 0.5
    repos = data.get("public_repos", 0)
    stars = data.get("total_stars", 0)
    languages = data.get("language_diversity", 0)
    contributions = data.get("contributions_year", 0)
    return float(repos * 5 + stars * 2 + languages * 10 + contributions * 0.5)


def calculate_leetcode_score(data: dict) -> float:
    # leetcode_score = total_solved * 2 + hard_solved * 5 + contest_rating * 0.1
    solved = data.get("total_solved", 0)
    hard = data.get("hard_solved", 0)
    rating = data.get("contest_rating", 0.0)
    return float(solved * 2 + hard * 5 + rating * 0.1)


def calculate_codeforces_score(data: dict) -> float:
    # codeforces_score = problems_solved * 1 + (cf_rating / 100) * 10 + contests * 2
    solved = data.get("problems_solved", 0)
    rating = data.get("cf_rating", 0.0)
    contests = data.get("contests", 0)
    return float(solved * 1 + (rating / 100.0) * 10.0 + contests * 2)


def get_deterministic_stats(username: str, platform: str) -> tuple[dict, float]:
    # Simple hash based on username characters to seed a local random generator
    seed_val = sum(ord(c) for c in username) + len(username)
    local_rand = random.Random(seed_val)
    
    if platform == "github":
        mock_data = {
            "public_repos": local_rand.randint(15, 60),
            "total_stars": local_rand.randint(5, 120),
            "language_diversity": local_rand.randint(3, 8),
            "contributions_year": local_rand.randint(100, 800)
        }
        score = calculate_github_score(mock_data)
    elif platform == "leetcode":
        mock_data = {
            "total_solved": local_rand.randint(50, 450),
            "hard_solved": local_rand.randint(5, 50),
            "contest_rating": float(local_rand.randint(1300, 2200))
        }
        score = calculate_leetcode_score(mock_data)
    else:  # codeforces
        mock_data = {
            "problems_solved": local_rand.randint(50, 600),
            "cf_rating": float(local_rand.randint(1000, 2400)),
            "contests": local_rand.randint(5, 80)
        }
        score = calculate_codeforces_score(mock_data)
        
    return mock_data, score


@router.post("/connect")
def connect_platform(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    platform = data.get("platform")   # github, leetcode, codeforces
    username = data.get("username")

    if platform not in ["github", "leetcode", "codeforces"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")

    # Check if profile already exists for this user
    profile = db.query(SocialProfile).filter(
        SocialProfile.user_id == current_user.id,
        SocialProfile.platform == platform
    ).first()

    if not profile:
        profile = SocialProfile(
            user_id=current_user.id,
            platform=platform,
            username=username
        )
        db.add(profile)
    else:
        profile.username = username

    # Generate mock/simulated profile data based on username deterministically
    mock_data, score = get_deterministic_stats(username, platform)

    profile.data = mock_data
    profile.portfolio_score = score
    profile.synced_at = datetime.utcnow()
    db.commit()

    # Recalculate composite portfolio_score on candidate application if any
    cand = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    if cand:
        # Aggregated Portfolio Score
        profiles = db.query(SocialProfile).filter(SocialProfile.user_id == current_user.id).all()
        git_val = next((p.portfolio_score for p in profiles if p.platform == "github"), 0.0)
        lt_val = next((p.portfolio_score for p in profiles if p.platform == "leetcode"), 0.0)
        cf_val = next((p.portfolio_score for p in profiles if p.platform == "codeforces"), 0.0)
        
        comp_score = min(git_val * 0.40 + lt_val * 0.35 + cf_val * 0.25, 1000.0)
        cand.portfolio_score = comp_score
        db.commit()

    return {
        "id": profile.id,
        "platform": profile.platform,
        "username": profile.username,
        "portfolio_score": profile.portfolio_score,
        "synced_at": profile.synced_at.strftime("%Y-%m-%d %H:%M:%S")
    }


@router.get("/portfolio/{id}")
def get_portfolio(
    id: str,
    db: Session = Depends(get_db)
):
    # Retrieve user ID (id can be "user-12" or "cand-12" or "emp-12" or just integer)
    user_id = None
    if id.startswith("cand-"):
        cand_id = int(id.split("-")[1])
        cand = db.query(Candidate).filter(Candidate.id == cand_id).first()
        if cand:
             user_id = cand.user_id
    elif id.startswith("emp-"):
        # Not standard, but handles employee profile
        pass
    else:
        try:
            user_id = int(id)
        except ValueError:
            pass

    if not user_id:
        # Try finding directly by user id
        try:
             clean_id = int(id.replace("user-", ""))
             user_id = clean_id
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid ID format")

    profiles = db.query(SocialProfile).filter(SocialProfile.user_id == user_id).all()
    
    profiles_dict = {}
    git_val = 0.0
    lt_val = 0.0
    cf_val = 0.0

    for p in profiles:
        profiles_dict[p.platform] = {
            "username": p.username,
            "score": p.portfolio_score,
            "data": p.data,
            "synced_at": p.synced_at.strftime("%Y-%m-%d") if p.synced_at else ""
        }
        if p.platform == "github":
             git_val = p.portfolio_score
        elif p.platform == "leetcode":
             lt_val = p.portfolio_score
        elif p.platform == "codeforces":
             cf_val = p.portfolio_score

    overall_score = min(git_val * 0.40 + lt_val * 0.35 + cf_val * 0.25, 1000.0)

    # Determine badges
    badges = []
    if "github" in profiles_dict:
        gh_data = profiles_dict["github"]["data"]
        if gh_data.get("public_repos", 0) > 40: badges.append("Prolific Developer")
        if gh_data.get("total_stars", 0) > 80: badges.append("Popular Projects")
        if gh_data.get("contributions_year", 0) > 400: badges.append("Open Source Hero")
    
    if "leetcode" in profiles_dict:
        lc_data = profiles_dict["leetcode"]["data"]
        if lc_data.get("total_solved", 0) > 200: badges.append("LeetCode Knight")
        if lc_data.get("hard_solved", 0) > 20: badges.append("Hard Hitter")

    if "codeforces" in profiles_dict:
        cf_data = profiles_dict["codeforces"]["data"]
        if cf_data.get("cf_rating", 0.0) > 1600: badges.append("Expert Coder")
        if cf_data.get("contests", 0) > 30: badges.append("Competitive Coder")

    return {
        "user_id": user_id,
        "overall_score": round(overall_score, 1),
        "profiles": profiles_dict,
        "achievements": badges,
        "top_projects": [
            {"name": "enterprise-crm", "stars": 12, "language": "TypeScript"},
            {"name": "ai-resume-screener", "stars": 8, "language": "Python"}
        ]
    }


@router.get("/sync/{platform}")
def sync_platform(
    platform: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    profile = db.query(SocialProfile).filter(
        SocialProfile.user_id == current_user.id,
        SocialProfile.platform == platform
    ).first()

    if not profile:
         raise HTTPException(status_code=404, detail="Platform not connected")

    # Trigger mock sync update
    data = profile.data or {}
    if platform == "github":
         data["total_stars"] = data.get("total_stars", 0) + random.randint(1, 3)
         data["contributions_year"] = data.get("contributions_year", 0) + random.randint(5, 15)
         profile.portfolio_score = calculate_github_score(data)
    elif platform == "leetcode":
         data["total_solved"] = data.get("total_solved", 0) + random.randint(1, 5)
         profile.portfolio_score = calculate_leetcode_score(data)
    elif platform == "codeforces":
         data["problems_solved"] = data.get("problems_solved", 0) + random.randint(1, 4)
         profile.portfolio_score = calculate_codeforces_score(data)

    profile.data = data
    profile.synced_at = datetime.utcnow()
    db.commit()

    return {"detail": f"{platform} synced successfully", "score": profile.portfolio_score}


@router.delete("/{platform}")
def disconnect_platform(
    platform: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    profile = db.query(SocialProfile).filter(
        SocialProfile.user_id == current_user.id,
        SocialProfile.platform == platform
    ).first()

    if not profile:
         raise HTTPException(status_code=404, detail="Platform connection not found")

    db.delete(profile)
    db.commit()
    return {"detail": f"Successfully disconnected {platform}"}
