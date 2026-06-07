from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.hr import Employee, Candidate, LeaveRequest, Payroll, Team, PayrollStatus

router = APIRouter()


@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    """
    Aggregated analytics dashboard data for the Analytics page.
    Returns employee, candidate, leave, payroll, and team stats.
    """
    # Employee stats
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.is_active == True).count()

    # Department distribution
    from app.models.hr import Employee as Emp
    from sqlalchemy import func as sqlfunc
    dept_counts = db.query(Emp.department, sqlfunc.count(Emp.id)).group_by(Emp.department).all()
    departments = {dept: count for dept, count in dept_counts if dept}

    # Candidate pipeline stats
    total_candidates = db.query(Candidate).count()
    from app.models.hr import CandidateStatus
    pipeline = {}
    for stage in CandidateStatus:
        cnt = db.query(Candidate).filter(Candidate.status == stage).count()
        if cnt > 0:
            pipeline[stage.value] = cnt

    avg_ats = 0.0
    if total_candidates > 0:
        from sqlalchemy import func as sf
        result = db.query(sf.avg(Candidate.resume_score)).scalar()
        avg_ats = round(float(result or 0), 1)

    # Leave stats
    total_leaves = db.query(LeaveRequest).count()
    approved_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "approved").count()
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "pending").count()
    approval_rate = round((approved_leaves / total_leaves * 100) if total_leaves > 0 else 0, 1)

    # Payroll stats
    from sqlalchemy import func as sf
    payroll_total = db.query(sf.sum(Payroll.net_salary)).scalar() or 0.0
    processed_count = db.query(Payroll).filter(Payroll.status == PayrollStatus.processed).count()
    pending_count = db.query(Payroll).filter(Payroll.status == PayrollStatus.pending).count()

    # Team performance
    teams = db.query(Team).all()
    team_stats = []
    for t in teams:
        team_stats.append({
            "name": t.name,
            "progress": int(t.progress or 0),
            "delayRisk": t.delay_risk or "low",
            "productivityScore": int(t.productivity_score or 0),
            "memberCount": len(t.members) if t.members else 0
        })

    avg_productivity = 0.0
    if team_stats:
        avg_productivity = round(sum(t["productivityScore"] for t in team_stats) / len(team_stats), 1)

    return {
        "employees": {
            "total": total_employees,
            "active": active_employees,
            "inactive": total_employees - active_employees,
            "departments": departments
        },
        "recruitment": {
            "totalCandidates": total_candidates,
            "pipeline": pipeline,
            "avgAtsScore": avg_ats,
        },
        "leaves": {
            "total": total_leaves,
            "approved": approved_leaves,
            "pending": pending_leaves,
            "approvalRate": approval_rate
        },
        "payroll": {
            "totalNetSalary": round(float(payroll_total), 2),
            "processedRecords": processed_count,
            "pendingRecords": pending_count
        },
        "teams": {
            "count": len(team_stats),
            "avgProductivity": avg_productivity,
            "details": team_stats
        }
    }
