from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.database import get_db
from app.models.user import User
from app.models.hr import Employee, PerformanceRecord, Payroll
from app.services.auth_service import get_current_user
from app.core.security import hash_password
from typing import List

router = APIRouter()


def get_current_user_dep(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]
    return get_current_user(token, db)


def parse_emp_id(id_str: str) -> int:
    if id_str.startswith("emp-"):
        return int(id_str.split("-")[1])
    try:
        return int(id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid employee ID format")


def format_employee(emp: Employee, user: User, db: Session):
    # Calculate performance rating from records, fallback to default
    records = db.query(PerformanceRecord).filter(PerformanceRecord.employee_id == emp.id, PerformanceRecord.metric == "rating").all()
    avg_rating = sum(r.value for r in records) / len(records) if records else 4.5
    # Normalize out of 5 from out of 10 if standard database uses 10
    if avg_rating > 5:
         avg_rating = round(avg_rating / 2.0, 1)

    return {
        "id": f"emp-{emp.id}",
        "name": user.full_name or user.username or "Employee",
        "email": user.email,
        "department": emp.department or "General",
        "role": emp.designation or "Staff",
        "status": "active" if emp.is_active else "suspended",
        "performanceRating": avg_rating,
        "joinDate": emp.joining_date.strftime("%Y-%m-%d") if emp.joining_date else datetime.now().strftime("%Y-%m-%d"),
        "avatar": f"https://ui-avatars.com/api/?name={user.full_name.replace(' ', '+') if user.full_name else 'User'}&background=random"
    }


@router.get("")
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    employees = db.query(Employee).all()
    result = []
    for emp in employees:
        user = db.query(User).filter(User.id == emp.user_id).first()
        if user:
            result.append(format_employee(emp, user, db))
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def add_employee(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    email = data.get("email")
    name = data.get("name")
    department = data.get("department", "Engineering")
    role = data.get("role", "Software Engineer")

    # 1. Check or create User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=name,
            password_hash=hash_password("Password123"),
            role="Employee"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Check or create Employee
    emp = db.query(Employee).filter(Employee.user_id == user.id).first()
    if emp:
        raise HTTPException(status_code=400, detail="Employee record already exists for this user")

    emp = Employee(
        user_id=user.id,
        department=department,
        designation=role,
        salary=5500.0 if department == "Engineering" else 4800.0,
        joining_date=datetime.utcnow(),
        is_active=True
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    # 3. Create initial pending payroll record
    month_str = datetime.now().strftime("%B %Y")
    payroll = Payroll(
        employee_id=emp.id,
        month=month_str,
        base_salary=emp.salary,
        deductions=300.0,
        net_salary=emp.salary - 300.0,
        status="pending"
    )
    db.add(payroll)
    db.commit()

    return format_employee(emp, user, db)


@router.put("/{id}")
def update_employee(
    id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    emp_id = parse_emp_id(id)
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = db.query(User).filter(User.id == emp.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User associated with employee not found")

    if "name" in data:
        user.full_name = data["name"]
    if "email" in data:
        user.email = data["email"]
    
    if "department" in data:
        emp.department = data["department"]
    if "role" in data:
        emp.designation = data["role"]
    if "status" in data:
        emp.is_active = (data["status"] == "active")

    db.commit()
    db.refresh(emp)
    db.refresh(user)

    return format_employee(emp, user, db)


@router.delete("/{id}")
def delete_employee(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    emp_id = parse_emp_id(id)
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = db.query(User).filter(User.id == emp.user_id).first()
    
    db.delete(emp)
    if user:
        db.delete(user)
    db.commit()

    return {"detail": "Employee deleted successfully"}
