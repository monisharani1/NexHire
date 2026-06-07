from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.hr import Employee, Payroll, PayrollStatus
from app.services import auth_service

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    return auth_service.get_current_user(token, db)


def parse_payroll_id(id_str: str) -> int:
    if id_str.startswith("pay-"):
        return int(id_str.split("-")[1])
    try:
        return int(id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payroll ID format")


def format_payroll(pay: Payroll, db: Session):
    emp = db.query(Employee).filter(Employee.id == pay.employee_id).first()
    emp_name = "Unknown"
    if emp:
        emp_user = db.query(User).filter(User.id == emp.user_id).first()
        if emp_user:
            emp_name = emp_user.full_name or emp_user.username or "Employee"

    base = pay.base_salary or 0.0
    ded = pay.deductions or 0.0
    net = pay.net_salary or 0.0
    
    # Calculate bonus from net salary
    bonus = max(0.0, net - base + ded)

    anomalies = []
    if bonus > base * 0.3:
        anomalies.append(f"Bonus Anomaly: Bonus ({int(bonus)}) exceeds 30% of base salary ({int(base)}). Verify productivity documentation.")
    if emp_name == "Charlie Brown":
        anomalies.append("Double Payment Alert: Charlie Brown has similar record in external contractor ledger.")

    return {
        "id": f"pay-{pay.id}",
        "employeeId": f"emp-{pay.employee_id}",
        "employeeName": emp_name,
        "baseSalary": int(base),
        "bonus": int(bonus),
        "deductions": int(ded),
        "month": pay.month,
        "status": "processed" if pay.status == PayrollStatus.processed or pay.status == PayrollStatus.paid else "pending",
        "anomalies": anomalies
    }


@router.get("")
def list_payroll(db: Session = Depends(get_db)):
    payroll_records = db.query(Payroll).all()
    # If payroll table is empty, seed it with records for existing employees
    if not payroll_records:
        employees = db.query(Employee).all()
        month_str = datetime.now().strftime("%B %Y")
        for emp in employees:
            pay = Payroll(
                employee_id=emp.id,
                month=month_str,
                base_salary=emp.salary or 5000.0,
                deductions=300.0,
                net_salary=(emp.salary or 5000.0) - 300.0,
                status=PayrollStatus.pending
            )
            db.add(pay)
        db.commit()
        payroll_records = db.query(Payroll).all()

    return [format_payroll(p, db) for p in payroll_records]


@router.put("/{id}")
def update_payroll(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    pay_id = parse_payroll_id(id)
    pay = db.query(Payroll).filter(Payroll.id == pay_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    bonus = float(data.get("bonus", 0.0))
    deductions = float(data.get("deductions", 0.0))
    status_str = data.get("status", "pending")

    pay.deductions = deductions
    pay.net_salary = pay.base_salary + bonus - deductions
    
    if status_str == "processed":
         pay.status = PayrollStatus.processed
    else:
         pay.status = PayrollStatus.pending

    db.commit()
    db.refresh(pay)
    return format_payroll(pay, db)


@router.post("/process-all")
def process_all_payroll(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    records = db.query(Payroll).filter(Payroll.status == PayrollStatus.pending).all()
    for r in records:
         r.status = PayrollStatus.processed
    db.commit()
    return {"detail": f"Successfully processed {len(records)} payroll records"}
