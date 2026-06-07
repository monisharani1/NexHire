"""
NexHire Database Seeder
=======================
Populates the database with demo data that exactly matches the frontend mock data
in HRContext.tsx so the "Developer Quick Login" accounts work immediately.

Run once after creating the database:
    python seed.py
"""
import sys
import os

# Allow running from the backend directory directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.models.user import User, SocialProfile
from app.models.hr import (
    Job, Candidate, Resume, Employee, PerformanceRecord,
    Payroll, PayrollStatus, Team, TeamUpdate, Complaint,
    LeaveRequest, SystemSettings, CandidateStatus
)
from app.core.security import hash_password
from datetime import datetime

DEFAULT_PASSWORD = "password"  # All demo accounts use "password"


def seed():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("🌱 Seeding NexHire database with demo data...")

        # ─────────────────────────────────────────────────────────
        # 1. Demo Users (match frontend Quick Login accounts)
        # ─────────────────────────────────────────────────────────
        hashed_pw = hash_password(DEFAULT_PASSWORD)
        
        def get_or_create_user(email, full_name, role):
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(email=email, full_name=full_name, password_hash=hashed_pw, role=role, is_active=True)
                db.add(u)
            return u

        u_hr = get_or_create_user("hr@enterprise.com", "Sarah Jenkins", "HR")
        u_lead = get_or_create_user("lead@enterprise.com", "Alice Smith", "Team Lead")
        u_emp = get_or_create_user("employee@enterprise.com", "Charlie Brown", "Employee")
        u_cand = get_or_create_user("candidate@enterprise.com", "Candidate Vance", "Candidate")

        # Extra employee users for the full employees list
        u_bob = get_or_create_user("b.johnson@enterprise.com", "Bob Johnson", "Employee")
        u_david = get_or_create_user("d.lee@enterprise.com", "David Lee", "Employee")
        u_emma = get_or_create_user("e.watson@enterprise.com", "Emma Watson", "Employee")

        db.commit()

        # refresh all to get IDs
        for u in [u_hr, u_lead, u_emp, u_cand, u_bob, u_david, u_emma]:
            db.refresh(u)

        print("  ✅ Users created")

        # ─────────────────────────────────────────────────────────
        # 2. Employees (7 employees matching frontend data)
        # ─────────────────────────────────────────────────────────
        joining_dates = {
            u_hr.id:    datetime(2023, 3, 12),
            u_lead.id:  datetime(2022, 6, 1),
            u_bob.id:   datetime(2022, 9, 18),
            u_emp.id:   datetime(2024, 2, 10),
            u_david.id: datetime(2024, 4, 1),
            u_emma.id:  datetime(2023, 11, 1),
        }
        employee_meta = {
            u_hr.id:    ("People & Culture",  "HR Manager",          6200.0),
            u_lead.id:  ("Engineering",        "Lead Developer",      7800.0),
            u_bob.id:   ("Design",             "Lead UI/UX Designer", 5900.0),
            u_emp.id:   ("Engineering",        "Software Engineer",   4500.0),
            u_david.id: ("Engineering",        "QA Analyst",          4200.0),
            u_emma.id:  ("Product",            "Product Manager",     6000.0),
        }
        ratings = {
            u_hr.id: 4.8, u_lead.id: 4.7,
            u_bob.id: 4.5, u_emp.id: 4.2, u_david.id: 4.0, u_emma.id: 4.6
        }

        employees_map = {}
        for uid, (dept, desig, salary) in employee_meta.items():
            emp = Employee(
                user_id=uid,
                department=dept,
                designation=desig,
                salary=salary,
                joining_date=joining_dates[uid],
                is_active=True
            )
            db.add(emp)
            db.commit()
            db.refresh(emp)
            employees_map[uid] = emp

            # Add performance rating record
            perf = PerformanceRecord(
                employee_id=emp.id,
                metric="rating",
                value=ratings[uid] * 2,  # store as /10 scale
                notes="Initial performance seed",
            )
            db.add(perf)

        db.commit()
        print("  ✅ Employees created")

        emp_hr    = employees_map[u_hr.id]
        emp_lead  = employees_map[u_lead.id]
        emp_bob   = employees_map[u_bob.id]
        emp_emp   = employees_map[u_emp.id]
        emp_david = employees_map[u_david.id]
        emp_emma  = employees_map[u_emma.id]

        # ─────────────────────────────────────────────────────────
        # 3. Teams
        # ─────────────────────────────────────────────────────────
        team1 = Team(
            name="Alpha Core Dev",
            lead_id=emp_lead.id,
            members=[emp_lead.id, emp_emp.id, emp_david.id],
            progress=85.0,
            delay_risk="low",
            description="Working on core backend architecture and system migrations.",
            productivity_score=92.0
        )
        team2 = Team(
            name="CX Design UI",
            lead_id=emp_bob.id,
            members=[emp_bob.id, emp_emma.id],
            progress=48.0,
            delay_risk="medium",
            description="Redesigning the customer checkout portals and landing assets.",
            productivity_score=79.0
        )
        db.add(team1)
        db.add(team2)
        db.commit()
        db.refresh(team1)
        db.refresh(team2)
        print("  ✅ Teams created")

        # ─────────────────────────────────────────────────────────
        # 4. Team Updates
        # ─────────────────────────────────────────────────────────
        upd1 = TeamUpdate(
            team_id=team1.id,
            date="2026-06-03",
            content="Database migration scripts are 90% completed. Working on testing latency bottlenecks. No major roadblocks expected.",
            progress=85.0,
            blockers=[],
            risk_level="low",
            ai_summary="Alpha Dev Core reports strong migration progress (90%) with active optimization. No blockers are detected, resulting in low risk."
        )
        upd2 = TeamUpdate(
            team_id=team2.id,
            date="2026-06-02",
            content="Figma mockups are done, but waiting for user analytics data. Emma's user research surveys are delayed by two days. May impact layout sprint timeline.",
            progress=48.0,
            blockers=["Emma survey delay", "Analytics data gap"],
            risk_level="medium",
            ai_summary="Design Sprint is at risk of delays due to pending user analytics and a 2-day survey lag. Mitigation recommended."
        )
        db.add(upd1)
        db.add(upd2)
        db.commit()
        print("  ✅ Team updates created")

        # ─────────────────────────────────────────────────────────
        # 5. Complaints
        # ─────────────────────────────────────────────────────────
        c1 = Complaint(
            title="Stress due to consecutive tight sprint cycles",
            description="Engineering sprints have been overlapping heavily with zero buffer. We are feeling constant burnout.",
            category="workload",
            is_anonymous=False,
            submitted_by="Alice Smith",
            status="pending",
            priority="high",
            sentiment="negative",
            date="2026-06-02"
        )
        c2 = Complaint(
            title="Kitchen pantry cleanliness issues",
            description="The second-floor office microwave is frequently left uncleaned and the dish racks are overflowing. Need a cleaning schedule.",
            category="workplace",
            is_anonymous=True,
            submitted_by="Anonymous Employee",
            status="resolved",
            priority="low",
            sentiment="neutral",
            date="2026-05-28"
        )
        c3 = Complaint(
            title="Health insurance dental coverage limits",
            description="The current dental co-pay limits are too low to cover basic root canals. Requesting review during benefits renewal.",
            category="benefits",
            is_anonymous=False,
            submitted_by="Charlie Brown",
            status="pending",
            priority="medium",
            sentiment="negative",
            date="2026-06-01"
        )
        db.add_all([c1, c2, c3])
        db.commit()
        print("  ✅ Complaints created")

        # ─────────────────────────────────────────────────────────
        # 6. Leave Requests
        # ─────────────────────────────────────────────────────────
        l1 = LeaveRequest(
            employee_id=emp_emp.id,
            type="annual",
            start_date="2026-06-15",
            end_date="2026-06-19",
            status="pending",
            reason="Family trip planned to national parks.",
            ai_action="approve",
            ai_message="Workload-aware analysis: Charlie has no pending blockers and his team (Alpha Core Dev) is at 85% progress. Safe to approve."
        )
        l2 = LeaveRequest(
            employee_id=emp_lead.id,
            type="annual",
            start_date="2026-06-08",
            end_date="2026-06-10",
            status="pending",
            reason="Attending web technologies conference.",
            ai_action="caution",
            ai_message="Resource Warning: Alice is the Lead Developer of Alpha Core Dev. A major database migration milestone is set for June 9th. Leave overlaps with this deadline."
        )
        db.add_all([l1, l2])
        db.commit()
        print("  ✅ Leave requests created")

        # ─────────────────────────────────────────────────────────
        # 7. Payroll Records
        # ─────────────────────────────────────────────────────────
        month_str = "June 2026"
        payroll_data = [
            (emp_hr,    6200.0, 350.0,  450.0, PayrollStatus.processed),
            (emp_admin, 9500.0,   0.0,  600.0, PayrollStatus.processed),
            (emp_lead,  7800.0, 600.0,  550.0, PayrollStatus.pending),
            (emp_bob,   5900.0, 1800.0, 420.0, PayrollStatus.pending),
            (emp_emp,   4500.0, 1500.0, 350.0, PayrollStatus.pending),
        ]
        for emp, base, bonus, ded, status in payroll_data:
            p = Payroll(
                employee_id=emp.id,
                month=month_str,
                base_salary=base,
                deductions=ded,
                net_salary=base + bonus - ded,
                status=status
            )
            db.add(p)
        db.commit()
        print("  ✅ Payroll records created")

        # ─────────────────────────────────────────────────────────
        # 8. Jobs
        # ─────────────────────────────────────────────────────────
        job1 = Job(
            title="Senior Frontend Engineer",
            description="Build and optimize modern client-side React Web applications.",
            required_skills=["5+ years React experience", "TypeScript competence", "TailwindCSS proficiency"],
            created_by=u_hr.id,
            is_active=True
        )
        job2 = Job(
            title="Lead UI/UX Designer",
            description="Define the design language for our enterprise dashboard portals.",
            required_skills=["Figma expert", "Prototyping tools", "Enterprise design systems"],
            created_by=u_hr.id,
            is_active=False
        )
        db.add(job1)
        db.add(job2)
        db.commit()
        db.refresh(job1)
        db.refresh(job2)
        print("  ✅ Jobs created")

        # ─────────────────────────────────────────────────────────
        # 9. Candidates (create user accounts first)
        # ─────────────────────────────────────────────────────────
        u_jonathan = User(
            email="j.vance@gmail.com", full_name="Jonathan Vance",
            password_hash=hashed_pw, role="Candidate",
            phone="+1-555-0199", is_active=True
        )
        u_rachel = User(
            email="rachel.g@gmail.com", full_name="Rachel Green",
            password_hash=hashed_pw, role="Candidate",
            phone="+1-555-0182", is_active=True
        )
        u_dbeckham = User(
            email="david.b@yahoo.com", full_name="David Beckham",
            password_hash=hashed_pw, role="Candidate",
            phone="+1-555-0210", is_active=True
        )
        db.add_all([u_jonathan, u_rachel, u_dbeckham])
        db.commit()
        for u in [u_jonathan, u_rachel, u_dbeckham]:
            db.refresh(u)

        cand1 = Candidate(
            user_id=u_jonathan.id, job_id=job1.id,
            status=CandidateStatus.screening, resume_score=88.0,
            portfolio_score=0.0, interview_score=0.0
        )
        cand2 = Candidate(
            user_id=u_rachel.id, job_id=job1.id,
            status=CandidateStatus.interviewed, resume_score=92.0,
            portfolio_score=0.0, interview_score=85.0
        )
        cand3 = Candidate(
            user_id=u_dbeckham.id, job_id=job1.id,
            status=CandidateStatus.rejected, resume_score=54.0,
            portfolio_score=0.0, interview_score=0.0
        )
        db.add_all([cand1, cand2, cand3])
        db.commit()
        db.refresh(cand1)
        db.refresh(cand2)
        db.refresh(cand3)

        # Add resume records for context
        r1 = Resume(
            candidate_id=cand1.id,
            file_path="Jonathan_Vance_Resume.pdf",
            score=88,
            strengths=["Excellent React expertise matches 100% of keywords", "Proficient in TypeScript", "Strong architectural experience"],
            gaps=["Missing: Cloud Deployment details"],
            recommendation="hire"
        )
        r2 = Resume(
            candidate_id=cand2.id,
            file_path="Rachel_Green_CV.pdf",
            score=92,
            strengths=["Master of React hooks and context patterns", "Deep knowledge of CSS and Tailwind", "TypeScript guru", "Excellent project examples"],
            gaps=[],
            recommendation="hire"
        )
        r3 = Resume(
            candidate_id=cand3.id,
            file_path="David_Beckham_Resume.pdf",
            score=54,
            strengths=["Some experience with HTML/CSS"],
            gaps=["Weak JavaScript frameworks knowledge", "No TypeScript experience"],
            recommendation="reject"
        )
        db.add_all([r1, r2, r3])
        db.commit()
        print("  ✅ Candidates & resumes created")

        # ─────────────────────────────────────────────────────────
        # 10. System Settings
        # ─────────────────────────────────────────────────────────
        sys_settings = SystemSettings(
            ai_min_ats_score=70,
            ai_auto_shortlist_threshold=85,
            enable_eye_contact_tracking=True,
            enable_sentiment_alerts=True,
            notification_email="hr-alerts@enterprise.com"
        )
        db.add(sys_settings)
        db.commit()
        print("  ✅ System settings created")

        print("\n🎉 Database seeded successfully!")
        print("\n📋 Demo accounts (all use password: 'password'):")
        print("   hr@enterprise.com         → HR Manager")
        print("   admin@enterprise.com      → System Admin")
        print("   lead@enterprise.com       → Team Lead")
        print("   employee@enterprise.com   → Regular Employee")
        print("   candidate@enterprise.com  → Job Candidate")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
