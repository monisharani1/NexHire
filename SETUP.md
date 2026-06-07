# NexHire Setup Guide — Phase 2

Run these commands IN ORDER in your terminal (PowerShell or Command Prompt).
Open a NEW terminal window for these steps.

---

## Step 1: Stop the currently running server
Press CTRL+C in the terminal that has `uvicorn` running.

---

## Step 2: Create the PostgreSQL database

Run this Python script:
```
cd C:\NexHire\backend
..\venv\Scripts\python create_db.py
```

Expected output:
```
✅ Database 'nexhire' created successfully!
✅ PostgreSQL connection is working!
```

---

## Step 3: Install updated dependencies

```
cd C:\NexHire\backend
..\venv\Scripts\pip install -r requirements.txt
```

---

## Step 4: Seed the database with demo data

```
cd C:\NexHire\backend
..\venv\Scripts\python seed.py
```

Expected output:
```
🌱 Seeding NexHire database with demo data...
  ✅ Users created
  ✅ Employees created
  ✅ Teams created
  ✅ Team updates created
  ✅ Complaints created
  ✅ Leave requests created
  ✅ Payroll records created
  ✅ Jobs created
  ✅ Candidates & resumes created
  ✅ System settings created

🎉 Database seeded successfully!
```

---

## Step 5: Start the server

```
cd C:\NexHire\backend
..\venv\Scripts\python -m uvicorn app.main:app --reload
```

---

## Step 6: Verify it's working

Open your browser and go to:
- http://localhost:8000/docs  — Swagger UI (test all endpoints)
- http://localhost:8000/api/employees  — Should return all 7 employees
- http://localhost:8000/api/analytics  — Dashboard stats

---

## Demo Login Credentials (all use password: "password")

| Email | Role |
|-------|------|
| hr@enterprise.com | HR Manager |
| admin@enterprise.com | System Admin |
| lead@enterprise.com | Team Lead |
| employee@enterprise.com | Regular Employee |
| candidate@enterprise.com | Job Candidate |
