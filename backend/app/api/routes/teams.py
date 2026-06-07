from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import datetime
import random

from app.db.database import get_db
from app.models.user import User
from app.models.hr import Employee, Team, TeamUpdate
from app.services import auth_service

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return auth_service.get_current_user(token, db)


def parse_team_id(id_str: str) -> int:
    if id_str.startswith("team-"):
        return int(id_str.split("-")[1])
    try:
        return int(id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid team ID format")


def format_team(team: Team, db: Session):
    lead_name = "Unknown"
    if team.lead_id:
        lead_emp = db.query(Employee).filter(Employee.id == team.lead_id).first()
        if lead_emp:
            lead_user = db.query(User).filter(User.id == lead_emp.user_id).first()
            if lead_user:
                lead_name = lead_user.full_name or lead_user.username or "Lead"

    # map members from JSON string/number list to string list with 'emp-' prefix
    formatted_members = []
    if team.members:
        # standard is list of user IDs or employee IDs. Let's make sure it is list of strings like ["emp-1", "emp-2"]
        for m in team.members:
            if isinstance(m, int):
                formatted_members.append(f"emp-{m}")
            elif isinstance(m, str) and not m.startswith("emp-"):
                formatted_members.append(f"emp-{m}")
            else:
                formatted_members.append(m)

    return {
        "id": f"team-{team.id}",
        "name": team.name,
        "leadId": f"emp-{team.lead_id}" if team.lead_id else "",
        "leadName": lead_name,
        "members": formatted_members,
        "progress": int(team.progress or 0),
        "delayRisk": team.delay_risk or "low",
        "description": team.description or "",
        "productivityScore": int(team.productivity_score or 0)
    }


def format_team_update(upd: TeamUpdate, db: Session):
    team = db.query(Team).filter(Team.id == upd.team_id).first()
    team_name = team.name if team else "Unknown"

    return {
        "id": f"upd-{upd.id}",
        "teamId": f"team-{upd.team_id}",
        "teamName": team_name,
        "date": upd.date,
        "content": upd.content,
        "progress": int(upd.progress or 0),
        "blockers": upd.blockers or [],
        "riskLevel": upd.risk_level or "low",
        "aiSummary": upd.ai_summary or ""
    }


@router.get("")
def list_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    return [format_team(t, db) for t in teams]


@router.post("")
def create_team(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    lead_id_str = data.get("leadId", "")
    lead_id = None
    if lead_id_str:
        if lead_id_str.startswith("emp-"):
            lead_id = int(lead_id_str.split("-")[1])
        else:
            try:
                lead_id = int(lead_id_str)
            except ValueError:
                pass

    members_raw = data.get("members", [])
    members_cleaned = []
    for m in members_raw:
        if isinstance(m, str) and m.startswith("emp-"):
            members_cleaned.append(int(m.split("-")[1]))
        elif isinstance(m, int):
            members_cleaned.append(m)
        else:
            try:
                members_cleaned.append(int(m))
            except ValueError:
                pass

    team = Team(
        name=data.get("name"),
        lead_id=lead_id,
        members=members_cleaned,
        progress=0.0,
        delay_risk="low",
        description=data.get("description", ""),
        productivity_score=float(random.randint(75, 95))
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return format_team(team, db)


@router.put("/{id}")
def update_team(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    team_id = parse_team_id(id)
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if "name" in data:
        team.name = data["name"]
    
    if "leadId" in data:
        lead_id_str = data["leadId"]
        if lead_id_str:
            if lead_id_str.startswith("emp-"):
                team.lead_id = int(lead_id_str.split("-")[1])
            else:
                try:
                    team.lead_id = int(lead_id_str)
                except ValueError:
                    pass
        else:
            team.lead_id = None

    if "members" in data:
        members_raw = data["members"]
        members_cleaned = []
        for m in members_raw:
            if isinstance(m, str) and m.startswith("emp-"):
                members_cleaned.append(int(m.split("-")[1]))
            elif isinstance(m, int):
                members_cleaned.append(m)
            else:
                try:
                    members_cleaned.append(int(m))
                except ValueError:
                    pass
        team.members = members_cleaned

    if "description" in data:
        team.description = data["description"]

    db.commit()
    db.refresh(team)
    return format_team(team, db)


@router.get("/updates")
def list_team_updates(db: Session = Depends(get_db)):
    updates = db.query(TeamUpdate).order_by(TeamUpdate.id.desc()).all()
    return [format_team_update(u, db) for u in updates]


@router.post("/updates")
def add_team_update(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    team_id_str = data.get("teamId", "")
    team_id = parse_team_id(team_id_str)

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    content = data.get("content", "")
    progress = float(data.get("progress", 0.0))
    blockers = data.get("blockers", [])

    has_blockers = len(blockers) > 0

    # Risk level + AI summary analysis simulation
    risk_level = "low"
    ai_summary = ""
    if progress < 40 and has_blockers:
        risk_level = "high"
        ai_summary = f"Critical Alert: {team.name} is lagging behind (progress {int(progress)}%) and reporting blocking issues: {', '.join(blockers)}. Action is required."
    elif has_blockers or progress < 70:
        risk_level = "medium"
        ai_summary = f"Risk warning: {team.name} reports intermediate blocker(s) [{', '.join(blockers)}]. Project path is vulnerable to slight delays."
    else:
        risk_level = "low"
        ai_summary = f"Healthy status: {team.name} reports steady progress ({int(progress)}%) and no critical blocks. Path is clear."

    new_upd = TeamUpdate(
        team_id=team.id,
        date=datetime.date.today().strftime("%Y-%m-%d"),
        content=content,
        progress=progress,
        blockers=blockers,
        risk_level=risk_level,
        ai_summary=ai_summary
    )
    db.add(new_upd)
    
    # Sync team progress and risk status
    team.progress = progress
    team.delay_risk = risk_level
    db.commit()

    return format_team_update(new_upd, db)
