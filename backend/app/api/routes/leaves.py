from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.hr import Employee, Team, LeaveRequest
from app.services import auth_service

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return auth_service.get_current_user(token, db)


def parse_leave_id(id_str: str) -> int:
    if id_str.startswith("leave-"):
        return int(id_str.split("-")[1])
    try:
        return int(id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid leave ID format")


def format_leave(leave: LeaveRequest, db: Session):
    emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
    emp_name = "Unknown"
    if emp:
        emp_user = db.query(User).filter(User.id == emp.user_id).first()
        if emp_user:
            emp_name = emp_user.full_name or emp_user.username or "Employee"

    return {
        "id": f"leave-{leave.id}",
        "employeeId": f"emp-{leave.employee_id}",
        "employeeName": emp_name,
        "type": leave.type,
        "startDate": leave.start_date,
        "endDate": leave.end_date,
        "status": leave.status or "pending",
        "reason": leave.reason,
        "aiRecommendation": {
            "action": leave.ai_action or "approve",
            "message": leave.ai_message or ""
        }
    }


@router.get("")
def list_leaves(db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).order_by(LeaveRequest.id.desc()).all()
    return [format_leave(l, db) for l in leaves]


@router.post("")
def submit_leave(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    emp_id_str = data.get("employeeId", "")
    emp_id = None
    if emp_id_str:
        if emp_id_str.startswith("emp-"):
            emp_id = int(emp_id_str.split("-")[1])
        else:
            try:
                emp_id = int(emp_id_str)
            except ValueError:
                pass

    if not emp_id:
        # Fallback to current user's employee ID
        emp_record = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp_record:
            emp_id = emp_record.id
        else:
            raise HTTPException(status_code=400, detail="Employee ID is required")

    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
         raise HTTPException(status_code=404, detail="Employee not found")

    emp_user = db.query(User).filter(User.id == emp.user_id).first()
    emp_name = emp_user.full_name if emp_user else "Employee"

    # Simulated Workload AI analysis
    ai_action = "approve"
    ai_message = f"Recommendation: Approve. {emp_name}'s team workload is balanced, and no imminent deadline overlaps are detected."

    # Check if employee is a team lead
    is_lead = db.query(Team).filter(Team.lead_id == emp.id).first() is not None
    
    # Check if employee belongs to any team with delay risk
    teams = db.query(Team).all()
    belongs_to_high_risk_team = False
    for t in teams:
        if t.members and emp.id in t.members:
             if t.delay_risk == "high" or (t.progress and t.progress < 50):
                  belongs_to_high_risk_team = True
                  break

    if is_lead:
        ai_action = "caution"
        ai_message = f"Resource Warning: {emp_name} is a Team Lead. Approving leaves requires setting a backup coordinator for lead operations."
    elif belongs_to_high_risk_team:
        ai_action = "caution"
        ai_message = f"Caution: {emp_name} belongs to a team with high project delay risks or low progress. Leave might impact critical sprint deliverables."

    leave = LeaveRequest(
        employee_id=emp.id,
        type=data.get("type", "annual"),
        start_date=data.get("startDate"),
        end_date=data.get("endDate"),
        status="pending",
        reason=data.get("reason", ""),
        ai_action=ai_action,
        ai_message=ai_message
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)

    return format_leave(leave, db)


@router.put("/{id}/status")
def update_leave_status(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    leave_id = parse_leave_id(id)
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
         raise HTTPException(status_code=404, detail="Leave request not found")

    status_str = data.get("status")
    if status_str in ["approved", "rejected", "pending"]:
         leave.status = status_str
    else:
         raise HTTPException(status_code=400, detail=f"Invalid status value: {status_str}")

    db.commit()
    db.refresh(leave)
    return format_leave(leave, db)
