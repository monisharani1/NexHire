# NexHire — HR Dashboard: Full Permissions & Controls
## Complete Specification for Antigravity

---

## CORE PHILOSOPHY

```
❌ NO DEFAULTS — Everything is configured by HR
✅ HR has full control over every parameter
✅ Nothing is automated without HR setting it up first
✅ AI assists, HR decides
```

---

## HR ROLE HIERARCHY

```
Admin (Super HR)
├── Can do everything below
├── Creates HR accounts
├── Sets company-wide settings
├── Views all jobs across all recruiters
└── Full audit trail access

Senior Manager
├── Views all jobs + candidates
├── Approves final hiring decisions
├── Views payroll recommendations
└── Cannot create jobs or edit JDs

HR Recruiter
├── Creates and manages own job postings
├── Screens candidates
├── Runs ATS + video interviews
├── Views interview results
└── Cannot approve final offers (needs manager approval)
```

---

## MODULE 1: JOB POSTING CONFIGURATION
### HR sets everything — no defaults

```
When HR creates a job posting, they MUST fill:

REQUIRED FIELDS (cannot publish without these):
├── Job Title (text)
├── Job Description (rich text)
├── Required Skills (tag input)
├── Experience Required (number, years)
├── Degree Required (dropdown: Any/B.E./B.Tech/M.Tech/MBA/PhD)
├── Department (text)
├── Location (text or "Remote")
└── Application Deadline (date picker)

SCREENING CONFIGURATION (HR decides, no defaults):
├── Max Applications to Accept
│   └── HR enters a number (e.g. 50)
│   └── Once limit reached → portal auto-closes
│   └── HR can increase/decrease limit anytime
│   └── HR sees live counter: "37 / 50 applications received"
│
├── ATS Auto-Reject Threshold
│   └── HR sets minimum ATS score to proceed
│   └── Example: "Reject below 45" OR "No auto-reject, show all"
│   └── If set: candidates below threshold auto-rejected
│   └── If not set: ALL candidates shown regardless of score
│
├── ATS Auto-Advance Threshold
│   └── HR sets score to auto-advance to interview
│   └── Example: "Auto-advance above 80"
│   └── If not set: HR manually advances each candidate
│
├── Interview Required (yes/no toggle)
│   └── If YES: which type?
│       ├── AI Video Interview only
│       ├── Text Chatbot only
│       └── Both (ATS first, then video)
│
├── Interview Question Count
│   └── HR sets: 3 / 5 / 7 / 10 questions
│   └── No default — HR must choose
│
├── Interview Time Limit
│   └── HR sets per-question time limit (minutes)
│   └── Example: 2 min per answer, 5 questions = 10 min total
│
└── Final Score Weights
    └── HR can customize the combined score formula:
        ├── ATS Score weight: [slider 0–100%]
        ├── Video Interview weight: [slider 0–100%]
        └── Portfolio Score weight: [slider 0–100%]
        └── Must sum to 100% (frontend validates)
        └── Default suggestion shown but HR must confirm
```

---

## MODULE 2: CANDIDATE PIPELINE VIEW
### What HR sees for each job

```
PIPELINE BOARD VIEW:
┌──────────┬───────────┬────────────┬───────────┬──────────┐
│ Applied  │ Screening │ Interviewed│  Review   │  Decided │
│   (12)   │    (8)    │    (5)     │    (3)    │   (2)    │
├──────────┼───────────┼────────────┼───────────┼──────────┤
│[Candidate│[Candidate │[Candidate  │[Candidate │[Offer]   │
│  Card]   │  Card]    │  Card]     │  Card]    │[Rejected]│
└──────────┴───────────┴────────────┴───────────┴──────────┘

CANDIDATE CARD shows:
├── Name + Profile Photo
├── ATS Score (badge: color-coded)
├── Video Interview Score (if taken)
├── Combined Score
├── Applied date
└── Quick actions: [View] [Advance] [Reject]
```

---

## MODULE 3: CANDIDATE PROFILE — FULL VIEW
### Everything HR can see about one candidate

```
┌────────────────────────────────────────────────────────────────┐
│ Candidate: John Doe                          [Advance] [Reject]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐   Name:       John Doe                       │
│  │  [Photo]    │   Email:      john@email.com                 │
│  │             │   Phone:      +91 9876543210                 │
│  └─────────────┘   College:    PES College of Engineering     │
│                    GitHub:     github.com/johndo              │
│                    LinkedIn:   linkedin.com/in/johndoe        │
│                    Applied:    June 5, 2025                   │
│                                                               │
├──────────── SCORES ───────────────────────────────────────────┤
│                                                               │
│  ATS Score:            78 / 100  🟡                          │
│  Video Interview:      82 / 100  ✅                          │
│  Portfolio Score:     650 / 1000                             │
│  COMBINED SCORE:       80 / 100  ✅                          │
│                                                               │
├──────────── RESUME ────────────────────────────────────────────┤
│                                                               │
│  [📄 View Resume]  [⬇ Download Resume]                        │
│                                                               │
│  ATS Breakdown:                                               │
│  Keywords     ██████████████████░░  22/30                     │
│  Skills       █████████████████░░░  20/25                     │
│  Experience   ████████████████████  18/20                     │
│  Format       ████████████░░░░░░░░  11/15                     │
│  Content      ████████░░░░░░░░░░░░   7/10                     │
│                                                               │
│  ✅ Matched: Python, FastAPI, PostgreSQL, Docker              │
│  ❌ Missing: Redis, Kubernetes                                │
│                                                               │
├──────────── AI VIDEO INTERVIEW ───────────────────────────────┤
│                                                               │
│  Status: Completed  │  Duration: 14 min  │  Date: June 6     │
│                                                               │
│  Overall: 82/100                                             │
│  Confidence:     85/100  ✅                                  │
│  Communication:  80/100  ✅                                  │
│  Technical:      79/100  🟡                                  │
│                                                               │
│  Per-Question Results:                                        │
│  Q1: Tell me about Python experience  → 88/100               │
│  Q2: FastAPI project walkthrough      → 85/100               │
│  Q3: Database design question         → 72/100               │
│  Q4: Problem solving scenario         → 79/100               │
│  Q5: Team collaboration               → 83/100               │
│                                                               │
│  Confidence Flags:                                           │
│  • Speaking pace: Normal (138 wpm) ✅                        │
│  • Filler words: 4 ✅                                        │
│  • Avg answer length: 102 words ✅                           │
│  • Sentiment: Positive ✅                                    │
│                                                               │
│  AI Recommendation: HIRE                                      │
│                                                               │
│  [▶ Play Recording]  [📄 Download Report]                     │
│                                                               │
│  HR Override:                                                 │
│  [Override AI Score] [Enter manual score] [Add notes]        │
│                                                               │
├──────────── SOCIAL PORTFOLIO ─────────────────────────────────┤
│                                                               │
│  Developer Score: 650/1000                                   │
│                                                               │
│  GitHub:      42 repos │ 127 stars │ Python, JS, FastAPI     │
│  LeetCode:    312 solved │ 45 Hard │ Rating: 1842            │
│  CodeForces:  Rating: 1524 (Specialist)                      │
│                                                               │
│  Top Projects:                                               │
│  • NexHire HRMS (FastAPI, React, PostgreSQL) ⭐ 38           │
│  • IPL Predictor (scikit-learn, Streamlit)  ⭐ 22           │
│                                                               │
├──────────── HR NOTES ─────────────────────────────────────────┤
│                                                               │
│  [Add note...]                                               │
│  June 6 - Priya (HR): Strong technical background. Advance.  │
│                                                               │
│  Status: [Dropdown: Applied/Screening/Interviewed/           │
│           Review/Offer/Rejected]                              │
│                                                               │
│  [Save Changes]                                              │
└────────────────────────────────────────────────────────────────┘
```

---

## MODULE 4: APPLICATION LIMIT CONTROL
### HR sets and manages acceptance limits

```
SETTING UP LIMITS (when creating/editing a job):

  Maximum Applications: [____] (HR enters number)
  
  When limit reached:
  ├── Option A: Close portal automatically
  ├── Option B: Show "applications full" to new candidates
  └── Option C: Keep open but mark as waitlist

LIVE COUNTER (visible to HR at all times):
  "Applications: 37 / 50"
  "Status: OPEN  [Close Now]  [Edit Limit]"
  
  When limit hit:
  "Applications: 50 / 50"
  "Status: CLOSED  [Reopen]  [Increase Limit to: ___]"

HR CAN:
  ├── Increase limit anytime (e.g. 50 → 75)
  ├── Decrease limit (only affects future — existing kept)
  ├── Close job manually at any time
  ├── Reopen closed job
  └── Set no limit (unlimited applications)
  
CANDIDATE SEES (when limit reached):
  "Applications for this position are currently closed.
   Check back later or explore other openings."
```

---

## MODULE 5: INTERVIEW RESULTS — HR VIEW
### Full AI Interview Report visible to HR

```
HR SEES ON DASHBOARD:
├── All completed interviews for a job (sorted by overall score)
├── Each interview: candidate name, score, recommendation, date
├── Click any → Full interview report (see Module 3 above)
├── Filter by: score range, recommendation, date, status
└── Bulk actions: advance top 5, reject below X score

INTERVIEW RESULTS TABLE:
┌──────────────────┬───────┬────────┬───────────┬────────────────┐
│ Candidate        │ ATS   │Interview│ Combined  │ Recommendation │
├──────────────────┼───────┼────────┼───────────┼────────────────┤
│ John Doe         │ 78    │  82    │   80      │ ✅ HIRE        │
│ Priya Sharma     │ 85    │  79    │   82      │ ✅ HIRE        │
│ Rahul K.         │ 65    │  71    │   68      │ 🟡 MAYBE       │
│ Anjali M.        │ 55    │  62    │   59      │ 🟠 REVIEW      │
│ Tom L.           │ 48    │  51    │   50      │ ❌ NO          │
└──────────────────┴───────┴────────┴───────────┴────────────────┘

[View All Recordings]  [Export Report]  [Bulk Advance Top N]

HR OVERRIDE SECTION (per candidate):
├── "Override AI Recommendation"
├── Select: [Hire] [Maybe] [Reject]
├── Add reason (text field, required for override)
├── Overrides logged in audit trail
└── "AI said: HIRE → HR changed to: REJECT — Reason: ..."
```

---

## MODULE 6: RESUME VIEWER
### HR can view actual resume in-app

```
RESUME VIEW OPTIONS:

Option A: Inline PDF Viewer (recommended)
  └── Render PDF directly in browser using PDF.js
  └── No download required
  └── HR can scroll through all pages

Option B: Download
  └── Direct download button
  └── HR downloads to local machine

Option C: Parsed View (ATS extracted data)
  └── Shows structured data extracted by ATS:
      Name, Skills, Experience, Education
  └── Highlights matched/missing keywords

RESUME VIEWER UI:
┌────────────────────────────────────────────────────────────────┐
│ Resume: John Doe                    [Download] [Close]         │
├─────────────────────────┬──────────────────────────────────────┤
│                         │                                      │
│  [PDF VIEWER]           │  ATS Highlights:                     │
│                         │  ✅ Python (found 8x)               │
│  Page 1 of 2            │  ✅ FastAPI (found 3x)              │
│                         │  ✅ PostgreSQL (found 2x)           │
│  [<<] [1] [2] [>>]      │  ❌ Redis (NOT FOUND)               │
│                         │  ❌ Docker (NOT FOUND)              │
│                         │                                      │
│                         │  Keyword Stuffing: None detected ✅  │
└─────────────────────────┴──────────────────────────────────────┘
```

---

## MODULE 7: HR DASHBOARD — OVERVIEW

```
┌────────────────────────────────────────────────────────────────┐
│ NexHire HR Dashboard          [+ Post New Job]  [Settings]     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ACTIVE JOBS                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Senior Python Engineer   │ 37/50 apps │ OPEN  │ [View]  │  │
│  │ React Frontend Dev       │ 12/30 apps │ OPEN  │ [View]  │  │
│  │ ML Engineer              │ 50/50 apps │ CLOSED│ [View]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  TODAY'S ACTIVITY                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ New Apps │ │ATS Done  │ │Interviews│ │Decisions │         │
│  │    8     │ │    6     │ │    4     │ │    2     │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                │
│  PENDING ACTIONS                                               │
│  ├── 5 candidates waiting for HR review                       │
│  ├── 2 interview results not yet reviewed                     │
│  └── 1 job posting reaching limit (48/50)                     │
│                                                                │
│  RECENT INTERVIEWS (Last 24 hours)                             │
│  ├── John Doe       → Python Engineer  → 82/100  ✅ HIRE      │
│  ├── Priya Sharma   → Python Engineer  → 79/100  🟡 MAYBE    │
│  └── Rahul K.       → React Dev        → 71/100  🟡 MAYBE    │
│                     [View All Interview Results]               │
└────────────────────────────────────────────────────────────────┘
```

---

## MODULE 8: HR SETTINGS
### Everything HR can configure

```
JOB SETTINGS (per job, set when creating):
├── Max applications
├── ATS reject threshold
├── ATS advance threshold
├── Interview type
├── Question count
├── Time limit per question
└── Score weights (ATS / Interview / Portfolio)

COMPANY SETTINGS (admin only):
├── Company name + logo
├── Recruiter accounts (create/deactivate)
├── Email notification preferences
├── Audit log retention period
└── Data retention policy (recordings)

INTERVIEW SETTINGS (per job):
├── Interview language
├── Custom opening message shown to candidate
├── Custom closing message
├── Whether to show score to candidate after interview
└── Auto-expire interview link (hours after sending)
```

---

## API ENDPOINTS — HR MODULES

```
# Job Management
POST   /api/hr/jobs                    Create job (HR sets all config)
GET    /api/hr/jobs                    List all HR's jobs
GET    /api/hr/jobs/{id}               Job detail + config
PUT    /api/hr/jobs/{id}               Update job / edit limit
DELETE /api/hr/jobs/{id}               Delete job
PATCH  /api/hr/jobs/{id}/close         Close applications
PATCH  /api/hr/jobs/{id}/reopen        Reopen applications
PATCH  /api/hr/jobs/{id}/limit         Update application limit

# Candidate Management
GET    /api/hr/candidates/{job_id}     All candidates for a job
GET    /api/hr/candidate/{id}          Full candidate profile
PATCH  /api/hr/candidate/{id}/status   Update status
POST   /api/hr/candidate/{id}/note     Add HR note

# Resume
GET    /api/hr/resume/{candidate_id}   View resume (PDF URL)
GET    /api/hr/resume/{id}/download    Download resume

# Interview Results
GET    /api/hr/interviews/{job_id}     All interviews for job
GET    /api/hr/interview/{session_id}  Full interview report
GET    /api/hr/interview/{id}/recording Signed recording URL
PUT    /api/hr/interview/{id}/override  Override AI score

# Dashboard
GET    /api/hr/dashboard               Overview stats
GET    /api/hr/pending-actions         Pending items list
```

---

## DATABASE ADDITIONS

```sql
-- Job config (extends jobs table)
ALTER TABLE jobs ADD COLUMN max_applications     INTEGER;
ALTER TABLE jobs ADD COLUMN current_applications INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN ats_reject_threshold INTEGER;
ALTER TABLE jobs ADD COLUMN ats_advance_threshold INTEGER;
ALTER TABLE jobs ADD COLUMN interview_type       VARCHAR(20);
  -- 'ai_video', 'chatbot', 'both', 'none'
ALTER TABLE jobs ADD COLUMN interview_questions  INTEGER;
ALTER TABLE jobs ADD COLUMN interview_time_limit INTEGER;  -- minutes
ALTER TABLE jobs ADD COLUMN score_weight_ats     FLOAT;    -- 0.0 to 1.0
ALTER TABLE jobs ADD COLUMN score_weight_video   FLOAT;
ALTER TABLE jobs ADD COLUMN score_weight_portfolio FLOAT;
ALTER TABLE jobs ADD COLUMN is_open              BOOLEAN DEFAULT TRUE;
ALTER TABLE jobs ADD COLUMN deadline             TIMESTAMP;

-- HR Notes on candidates
CREATE TABLE candidate_notes (
  id           SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id),
  hr_user_id   INTEGER REFERENCES users(id),
  note         TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- HR overrides on interview scores
ALTER TABLE interview_sessions ADD COLUMN hr_override_score   FLOAT;
ALTER TABLE interview_sessions ADD COLUMN hr_override_reason  TEXT;
ALTER TABLE interview_sessions ADD COLUMN overridden_by       INTEGER REFERENCES users(id);
ALTER TABLE interview_sessions ADD COLUMN overridden_at       TIMESTAMP;
```

---

*This doc covers: full HR permissions, candidate resume viewing,*
*application limit control, interview results viewing, and all HR*
*dashboard modules. No defaults — HR configures everything.*
*Hand to Antigravity as the HR module specification.*
