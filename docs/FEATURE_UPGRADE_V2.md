# NexHire — Complete Feature Upgrade Specification
## All Issues + New Features — Build Guide for Antigravity

---

## SECTION 1: BUG FIXES (Fix These First)

---

### BUG 1: ATS — Non-Resume PDF Upload
**Problem:** User uploads a non-resume PDF, it still gets scored.
**Fix:** Show a re-upload prompt instead of a score.

```
FLOW:
1. User uploads PDF
2. Backend runs Document Gate Check (Stage 0 from ATS_SCORING_V2.md)
3. If gate FAILS:
   └── DO NOT show score
   └── Show this UI:

┌─────────────────────────────────────────────────────┐
│  ⚠️  This doesn't look like a resume                │
│                                                     │
│  We couldn't detect standard resume sections        │
│  (Contact Info, Work Experience, Education,Skills)  │
│                                                     │
│  What we found: [document type from Claude]         │
│  e.g. "This appears to be a research report"        │
│                                                     │
│  [📄 Upload a Different File]  [Try Again]          │
└─────────────────────────────────────────────────────┘

4. Clear the previous file from state
5. Reset the upload area to empty
6. Let user upload fresh

NEVER show a score for a failed gate document.
```

---

### BUG 2: ATS Rankings Page Goes Blank
**Problem:** Select job (e.g. Senior Frontend Dev) → page goes blank.
**Root cause:** API call likely returns empty array or error,
component crashes on null/undefined data.

**Fix:**
```typescript
// Always handle empty state + loading + error

const ATSRankings = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // On job select:
  useEffect(() => {
    if (!selectedJobId) return;
    setLoading(true);
    setError(null);

    api.get(`/api/ats/rankings/${selectedJobId}`)
      .then(r => setCandidates(r.data ?? []))  // ?? [] prevents null crash
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  if (loading) return <SkeletonTable rows={5} />;
  if (error)   return <ErrorState message={error} onRetry={refetch} />;
  if (candidates.length === 0) return <EmptyState
    icon="📋"
    title="No candidates yet"
    subtitle="Candidates will appear here after applying and completing ATS screening."
  />;

  return <CandidatesTable data={candidates} />;
};
```

**Backend fix too:**
```python
@router.get("/api/ats/rankings/{job_id}")
def get_ats_rankings(job_id: int, db: Session = Depends(get_db)):
    candidates = db.query(Candidate).filter(
        Candidate.job_id == job_id
    ).order_by(Candidate.resume_score.desc().nullslast()).all()

    # Always return a list, never null
    return candidates or []
```

---

### BUG 3: Quick Search Not Working
**Problem:** Search returns nothing regardless of query.
**Fix:** See Section 5 (Quick Search) below.

---

### BUG 4: AI Video Interview Results Not Showing in HR Dashboard
**Problem:** After candidate finishes interview, HR sees empty dashboard.
**Fix:** See Section 2 below.

---

## SECTION 2: AI VIDEO INTERVIEW — HR RESULTS VIEW

After a candidate completes their video interview,
the HR dashboard must show the full evaluation.

### What HR Sees (Interview Results Page)

```
┌───────────────────────────────────────────────────────────────┐
│ AI Video Interview Evaluations              [Job: Dropdown ▼] │
│ Select a requisition to inspect candidate scorecards          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ COMPLETED INTERVIEWS (4)                                      │
│                                                               │
│ ┌──────────────────┐  ┌─────────────────────────────────────┐│
│ │ Candidate List   │  │ Selected Candidate Report           ││
│ │                  │  │                                     ││
│ │ ● John Doe       │  │ John Doe — Senior Frontend Dev      ││
│ │   82/100 ✅      │  │ Interviewed: June 7, 2025, 2:14 PM  ││
│ │                  │  │ Duration: 16 min                    ││
│ │ ● Priya Sharma   │  ├─────────────────────────────────────┤│
│ │   76/100 🟡      │  │ OVERALL SCORE: 82/100               ││
│ │                  │  │ Recommendation: ✅ HIRE             ││
│ │ ● Rahul K.       │  ├─────────────────────────────────────┤│
│ │   61/100 🟠      │  │ Score Breakdown:                    ││
│ │                  │  │ Confidence:    85/100 ████████░░    ││
│ │ ● Anjali M.      │  │ Communication: 80/100 ████████░░    ││
│ │   55/100 ❌      │  │ Technical:     79/100 ███████░░░    ││
│ │                  │  ├─────────────────────────────────────┤│
│ └──────────────────┘  │ Confidence Flags:                   ││
│                       │ • Pace: 138 wpm (Normal) ✅         ││
│                       │ • Filler words: 4 ✅                ││
│                       │ • Avg answer: 102 words ✅          ││
│                       │ • Sentiment: Positive ✅            ││
│                       ├─────────────────────────────────────┤│
│                       │ Per-Question Scores:                ││
│                       │ Q1: Python exp      → 88/100 ✅    ││
│                       │ Q2: FastAPI project → 85/100 ✅    ││
│                       │ Q3: DB design       → 72/100 🟡    ││
│                       │ Q4: Problem solving → 79/100 🟡    ││
│                       │ Q5: Team work       → 83/100 ✅    ││
│                       ├─────────────────────────────────────┤│
│                       │ AI Strengths:                       ││
│                       │ ✅ Strong Python fundamentals       ││
│                       │ ✅ Good communication               ││
│                       │ ✅ Clear project examples           ││
│                       │                                     ││
│                       │ AI Weaknesses:                      ││
│                       │ ⚠️ DB design needs work             ││
│                       │ ⚠️ Moderate filler word usage       ││
│                       ├─────────────────────────────────────┤│
│                       │ [▶ Play Recording] [📄 Download]    ││
│                       │ [Override Score]  [Add Notes]       ││
│                       └─────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### Backend: Auto-populate results after interview
```python
# When interview completes → trigger scoring immediately
@router.post("/api/interview/complete")
async def complete_interview(session_id: str, transcript: list, db: Session):
    # 1. Save transcript to DB
    # 2. Calculate speaking metrics (wpm, filler words, sentiment)
    # 3. Call Claude for full scoring report
    # 4. Save report to interview_sessions table
    # 5. Update candidate overall score
    # 6. Notify HR (optional: in-app notification)
    # 7. Return { report_id, overall_score }

    report = await generate_interview_report(transcript, session_id, db)

    session = db.query(InterviewSession).filter_by(uuid=session_id).first()
    session.ai_report             = report
    session.overall_score         = report["overall_score"]
    session.confidence_score      = report["confidence_score"]
    session.communication_score   = report["communication_score"]
    session.technical_accuracy_score = report["technical_accuracy_score"]
    session.hire_recommendation   = report["hire_recommendation"]
    session.status                = "completed"
    session.completed_at          = datetime.utcnow()
    db.commit()

    return { "report_id": session.id, "overall_score": report["overall_score"] }
```

---

## SECTION 3: USER PROFILES — ALL ROLES

### Profile Structure (LinkedIn-style tagline)

Every user has:
```
Name:        [Full Name]
Tagline:     [Short professional description — like LinkedIn headline]
             Examples:
             HR:        "HR Manager at Infosys | Talent Acquisition | Investor"
             Candidate: "Intern @ MKN Pvt Ltd | B.E. CSE (AI&ML) | Open to Work"
             Employee:  "Senior Developer @ TCS | Python | FastAPI | Building NexHire"
             Lead:      "Engineering Lead @ Wipro | 8 Years Experience | Mentor"
Role Badge:  [HR] [Student] [Employee] [Lead] [Admin]
Avatar:      Profile photo (from Google/GitHub or uploaded)
```

### Profile Edit Page (All Roles)

```
┌───────────────────────────────────────────────────────────────┐
│ Edit Profile                                     [Save] [Cancel]│
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  [📷 Change Photo]                                            │
│  Current photo shown as circle avatar                         │
│                                                               │
│  Full Name *          [________________________]              │
│  Tagline              [________________________]              │
│                       e.g. "HR at Infosys | Investor"         │
│                                                               │
│  Email *              [________________________] (read-only)  │
│  Phone                [________________________]              │
│  Location             [________________________]              │
│                       e.g. "Bengaluru, Karnataka"             │
│                                                               │
│  ── Professional Info ──────────────────────────────────      │
│  Current Status *     [Dropdown ▼]                            │
│                       Student / Working Professional /        │
│                       Freelancer / Job Seeker / HR            │
│                                                               │
│  Designation          [________________________]              │
│                       e.g. "Software Engineer", "HR Manager"  │
│  Company / College    [________________________]              │
│                       e.g. "Infosys" or "PES College"         │
│  Department           [________________________]              │
│  Years of Experience  [__] years                              │
│                                                               │
│  ── For Students ───────────────────────────────────          │
│  Graduation Year      [____]                                  │
│  Degree               [________________________]              │
│  Branch / Major       [________________________]              │
│                                                               │
│  ── Social Links ───────────────────────────────────          │
│  GitHub URL           [________________________]              │
│  LinkedIn URL         [________________________]              │
│  Portfolio URL        [________________________]              │
│                                                               │
│  ── Bio ────────────────────────────────────────────          │
│  About Me             [________________________]              │
│                       (max 300 characters)                    │
│                                                               │
│                                    [Save Changes]             │
└───────────────────────────────────────────────────────────────┘
```

### Profile View (Public — what others see)

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  [Photo]  John Doe                          [Edit Profile] ✏️ │
│           Intern @ MKN Pvt Ltd | B.E. CSE   [STUDENT badge]  │
│           Bengaluru, Karnataka                                │
│                                                               │
│  📧 john@email.com   📱 +91 98765...   🔗 github.com/john    │
│                                                               │
│  About: Passionate developer building AI-powered products.   │
│  Currently interning at MKN. Open to full-time roles.        │
│                                                               │
│  ── Developer Score ─────────────────────────────────────    │
│  650/1000  GitHub: 42 repos  LeetCode: 312  CF: 1524         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## SECTION 4: ONBOARDING FLOW (New User Registration)

When a new account is created (Google/GitHub/Email),
collect all details before entering the app.

### Onboarding Steps (Multi-step form)

```
STEP 1 of 4 — Basic Info
─────────────────────────────────────────────────────
Full Name *          [________________________]
Phone Number         [________________________]
Location             [________________________]
Date of Birth        [____/____/________]       (optional)
Gender               [Dropdown: Male/Female/Other/Prefer not to say]

[Next →]

─────────────────────────────────────────────────────
STEP 2 of 4 — Professional Status
─────────────────────────────────────────────────────
I am a... *          (radio buttons)
  ○ Student
  ○ Working Professional
  ○ Job Seeker
  ○ Freelancer
  ○ HR / Recruiter

IF Student:
  College / University *  [________________________]
  Degree *                [B.E. / B.Tech / M.Tech / MBA / Other]
  Branch / Major *        [________________________]
  Graduation Year *       [____]
  Current CGPA            [____]

IF Working Professional:
  Current Company *       [________________________]
  Designation *           [________________________]
  Department              [________________________]
  Years of Experience *   [__]

IF HR / Recruiter:
  Company *               [________________________]
  HR Role *               [HR Manager / Recruiter / Talent Lead / Other]
  Team Size               [__]

[← Back]  [Next →]

─────────────────────────────────────────────────────
STEP 3 of 4 — Your Tagline & Bio
─────────────────────────────────────────────────────
Tagline *             [________________________]
                      (shows under your name everywhere)
                      Suggestions based on Step 2 selection:
                      Student:      "B.E. CSE @ PES College | Open to Internships"
                      Professional: "SDE @ Infosys | Python | React"
                      HR:           "HR Manager @ Wipro | Talent Acquisition"

About Me              [________________________]
                      (max 300 characters, optional)

[← Back]  [Next →]

─────────────────────────────────────────────────────
STEP 4 of 4 — Social Links (optional but recommended)
─────────────────────────────────────────────────────
GitHub Profile        [________________________]
                      (auto-filled if signed in with GitHub ✅)
LinkedIn Profile      [________________________]
Portfolio / Website   [________________________]
LeetCode Username     [________________________]
CodeForces Handle     [________________________]

[← Back]  [Finish & Go to Dashboard →]
─────────────────────────────────────────────────────

Progress bar shown at top: ● ● ○ ○ → ● ● ● ○ → ● ● ● ●
Skip allowed from Step 3 onwards (social links optional)
All data saved to users table + social_profiles table
```

---

## SECTION 5: QUICK SEARCH — FIX & IMPLEMENTATION

**Current problem:** Search returns nothing.
**Fix:** Implement proper full-text search across all entities.

### What Quick Search Must Find

```
Search by ANY of:
├── Candidate name
├── Candidate email
├── HR name
├── Employee name
├── Job title
├── Company name
├── Skill (e.g. "Python" → shows all Python candidates)
└── Username / handle
```

### Search Implementation

```typescript
// Frontend: SearchBar component
// Debounced — waits 300ms after user stops typing

const [query, setQuery]     = useState('');
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(false);
const [open, setOpen]       = useState(false);

useEffect(() => {
  if (query.length < 2) { setResults([]); setOpen(false); return; }

  const timer = setTimeout(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
      setResults(res.data.results);
      setOpen(true);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, 300);

  return () => clearTimeout(timer);
}, [query]);
```

```python
# Backend: /api/search endpoint
@router.get("/api/search")
def global_search(q: str, limit: int = 8, db: Session = Depends(get_db)):
    """
    Full-text search across users, jobs, companies.
    Uses PostgreSQL ILIKE for case-insensitive partial matching.
    """
    query = f"%{q}%"

    # Search users (candidates + HR)
    users = db.query(User).filter(
        or_(
            User.full_name.ilike(query),
            User.email.ilike(query),
            User.username.ilike(query),
        )
    ).limit(limit).all()

    # Search jobs
    jobs = db.query(Job).filter(
        or_(
            Job.title.ilike(query),
            Job.description.ilike(query),
        )
    ).filter(Job.is_active == True).limit(4).all()

    results = []

    for u in users:
        results.append({
            "type":    "user",
            "id":      u.id,
            "name":    u.full_name,
            "email":   u.email,
            "tagline": u.tagline,
            "role":    u.role,
            "photo":   u.photo_url,
            "url":     f"/profile/{u.id}"
        })

    for j in jobs:
        results.append({
            "type":    "job",
            "id":      j.id,
            "title":   j.title,
            "url":     f"/jobs/{j.id}"
        })

    return { "results": results, "query": q }
```

### Search Dropdown UI

```
┌──────────────────────────────────────────────┐
│ 🔍 john                                      │ ← user typing
├──────────────────────────────────────────────┤
│ PEOPLE                                       │
│ [Photo] John Doe                             │
│         Intern @ MKN | Student               │
│         john@email.com                       │
│                                              │
│ [Photo] John Smith                           │
│         HR Manager @ Infosys | HR            │
│         jsmith@infosys.com                   │
│                                              │
│ JOBS                                         │
│ 💼 Senior Python Engineer → [View Job]       │
│ 💼 Junior React Developer → [View Job]       │
│                                              │
│ [View all results for "john"]               │
└──────────────────────────────────────────────┘
```

---

## SECTION 6: SKELETON LOADING SCREENS

Show skeleton UI whenever data is loading (network requests).
Reference: LinkedIn-style skeleton (Image 3 provided).

### Skeleton Components to Build

```typescript
// SkeletonCard — for profile cards
const SkeletonCard = () => (
  <div className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
    <div className="w-12 h-12 bg-gray-200 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

// SkeletonTable — for ATS rankings, candidate lists
const SkeletonTable = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-3">
    {Array(rows).fill(0).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border rounded">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-1/6" />
        <div className="h-4 bg-gray-200 rounded w-1/6" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-1/6" />
      </div>
    ))}
  </div>
);

// SkeletonDashboard — for main dashboard widgets
const SkeletonDashboard = () => (
  <div className="animate-pulse space-y-6">
    {/* Stats row */}
    <div className="grid grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-xl" />
      ))}
    </div>
    {/* Content cards */}
    <div className="grid grid-cols-2 gap-6">
      <div className="h-64 bg-gray-200 rounded-xl" />
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  </div>
);

// SkeletonProfile — LinkedIn-style (like Image 3)
const SkeletonProfile = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-200 rounded-full" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-4/5" />
      <div className="h-3 bg-gray-200 rounded w-3/4" />
    </div>
  </div>
);
```

### Where to Use Skeletons

```
Every page that fetches data:
├── ATS Rankings page     → SkeletonTable while loading
├── HR Dashboard          → SkeletonDashboard while loading
├── Candidate list        → SkeletonCard × N while loading
├── Profile pages         → SkeletonProfile while loading
├── Interview results     → SkeletonCard while loading
├── Search results        → SkeletonCard × 3 while loading
└── Job listings          → SkeletonCard × N while loading

Rule: ANY api call → show skeleton → replace with data
```

---

## SECTION 7: LANDING PAGE

Full marketing landing page for NexHire.
Show features, screenshots/UI mockups, call-to-action.

### Landing Page Sections

```
1. HERO
─────────────────────────────────────────────
  Headline: "Hire Smarter with AI"
  Subline:  "NexHire automates resume screening,
             conducts AI video interviews, and
             delivers instant candidate insights —
             so your HR team focuses on what matters."

  [Get Started Free]  [Watch Demo ▶]

  Hero visual: animated dashboard mockup / screenshot

─────────────────────────────────────────────
2. SOCIAL PROOF (numbers)
─────────────────────────────────────────────
  1,200+ Candidates Screened
  500+ Interviews Conducted
  40+ Companies Using NexHire
  98% Satisfaction Rate

─────────────────────────────────────────────
3. FEATURES (with UI screenshots + Try It Now)
─────────────────────────────────────────────

FEATURE CARD 1 — AI Resume ATS Scoring
  Icon: 📄
  Title: "Instant Resume Scoring"
  Description: "Upload any resume and get a detailed ATS score
    in seconds. Know exactly why a candidate passes or fails —
    keyword coverage, skills match, experience fit, format quality."
  Screenshot: ATS score breakdown UI
  CTA: [Try Resume Screening →]

FEATURE CARD 2 — AI Video Interview
  Icon: 🎥
  Title: "AI Video Interview"
  Description: "Our AI interviewer speaks to your candidate,
    listens to their answers, and scores them on confidence,
    communication, and technical accuracy. Full recording stored
    for HR validation."
  Screenshot: Interview room UI
  CTA: [See How It Works →]

FEATURE CARD 3 — Developer Portfolio Score
  Icon: 💻
  Title: "GitHub + LeetCode + CodeForces Portfolio"
  Description: "Automatically pull candidate profiles from GitHub,
    LeetCode, and CodeForces. Calculate a Developer Score (0–1000)
    to instantly compare technical ability."
  Screenshot: Portfolio dashboard
  CTA: [Connect Your Profiles →]

FEATURE CARD 4 — Smart Candidate Pipeline
  Icon: 🔄
  Title: "End-to-End Hiring Pipeline"
  Description: "From job posting to final offer — manage every
    candidate in a visual pipeline. Set your own screening
    thresholds, application limits, and interview requirements."
  Screenshot: Kanban pipeline view
  CTA: [View Demo →]

FEATURE CARD 5 — Business Analytics (PREMIUM 🔒)
  Icon: 📊
  Title: "Business Analytics" [PREMIUM badge]
  Description: "Track hiring funnel efficiency, time-to-hire,
    cost-per-hire, and team performance. Make data-driven
    decisions with AI-powered insights."
  Screenshot: Analytics dashboard (blurred/locked)
  CTA: [Unlock with Premium →]

FEATURE CARD 6 — Payroll Intelligence (PREMIUM 🔒)
  Icon: 💰
  Title: "Payroll Recommendations" [PREMIUM badge]
  Description: "AI-driven salary adjustment recommendations
    based on performance, attendance, and market benchmarks.
    Approve or override with full reasoning."
  Screenshot: Payroll dashboard (blurred/locked)
  CTA: [Unlock with Premium →]

─────────────────────────────────────────────
4. WHAT WE DO FOR COMPANIES
─────────────────────────────────────────────
  Section title: "What NexHire Does for Your Company"

  ✅ Reduces hiring time by up to 70%
  ✅ Eliminates resume screening bias
  ✅ Automates first-round interviews
  ✅ Gives every candidate a fair, consistent evaluation
  ✅ Stores video evidence for legal compliance
  ✅ Integrates developer portfolios into hiring decisions
  ✅ Scales to 1,000+ applicants per role

  [Start Free Trial]

─────────────────────────────────────────────
5. PRICING
─────────────────────────────────────────────
  FREE (Individuals / Students)
  ├── Resume ATS Scoring
  ├── AI Video Interviews (up to 5/month)
  ├── Developer Portfolio
  ├── Job Applications
  └── Basic Dashboard
  [Get Started Free]

  PREMIUM (Organizations) — [Contact Sales]
  ├── Everything in Free
  ├── Unlimited AI Interviews
  ├── Business Analytics Dashboard
  ├── Payroll Intelligence
  ├── Bulk Resume Screening
  ├── Custom Interview Questions
  ├── Priority Support
  └── API Access
  [Contact Sales] or [Request Demo]

─────────────────────────────────────────────
6. ABOUT
─────────────────────────────────────────────
  "NexHire was built by students who experienced
   the frustration of opaque hiring processes.
   We believe every candidate deserves a fair,
   transparent evaluation — powered by AI."

  Built at PES College of Engineering, Mandya
  Department of CSE (AI & ML)

─────────────────────────────────────────────
7. FOOTER
─────────────────────────────────────────────
  NexHire | Features | Pricing | About | Contact
  Privacy Policy | Terms of Service
  © 2025 NexHire. All rights reserved.
```

---

## SECTION 8: PREMIUM LOCK SYSTEM

Payroll and Business Analytics are PREMIUM features.
Free users see them but cannot use them.

### Lock UI Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Business Analytics                    [🔒 PREMIUM]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [BLURRED SCREENSHOT of analytics dashboard]               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔒 This feature is available on Premium            │   │
│  │                                                     │   │
│  │  Unlock Business Analytics to:                      │   │
│  │  • Track hiring funnel metrics                      │   │
│  │  • Measure time-to-hire efficiency                  │   │
│  │  • Identify top-performing job sources              │   │
│  │  • Download detailed reports                        │   │
│  │                                                     │   │
│  │  Premium is available for Organizations only.       │   │
│  │                                                     │   │
│  │  [Contact Sales]  [Learn More]                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Which Features Are Locked

```
FREE (all users):
✅ Resume ATS Scoring
✅ AI Video Interviews (5/month limit)
✅ Developer Portfolio
✅ Job Browse + Apply
✅ Basic HR Dashboard
✅ Candidate Pipeline
✅ Social Auth (Google + GitHub)
✅ Profile + Onboarding

PREMIUM (organizations only):
🔒 Business Analytics
🔒 Payroll Recommendations
🔒 Unlimited AI Interviews
🔒 Bulk Resume Screening
🔒 Advanced Reporting + Export
🔒 API Access
```

### Backend: Premium Check

```python
def require_premium(current_user: User = Depends(get_current_user)):
    if not current_user.is_premium:
        raise HTTPException(
            status_code=403,
            detail={
                "code":    "PREMIUM_REQUIRED",
                "message": "This feature requires a Premium subscription.",
                "upgrade_url": "/pricing"
            }
        )
    return current_user

# Usage on premium routes:
@router.get("/api/analytics/business")
def get_business_analytics(user = Depends(require_premium)):
    ...

@router.get("/api/payroll/recommendations")
def get_payroll_recommendations(user = Depends(require_premium)):
    ...
```

### DB addition:
```sql
ALTER TABLE users ADD COLUMN is_premium       BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN premium_plan     VARCHAR(20); -- 'org', null
ALTER TABLE users ADD COLUMN premium_expires  TIMESTAMP;
```

---

## SECTION 9: DATABASE ADDITIONS (All sections)

```sql
-- Profile additions
ALTER TABLE users ADD COLUMN tagline      VARCHAR(255);
ALTER TABLE users ADD COLUMN designation  VARCHAR(100);
ALTER TABLE users ADD COLUMN company      VARCHAR(100);
ALTER TABLE users ADD COLUMN department   VARCHAR(100);
ALTER TABLE users ADD COLUMN location     VARCHAR(100);
ALTER TABLE users ADD COLUMN bio          VARCHAR(300);
ALTER TABLE users ADD COLUMN photo_url    VARCHAR(500);
ALTER TABLE users ADD COLUMN provider     VARCHAR(20);
ALTER TABLE users ADD COLUMN status       VARCHAR(30);
  -- 'student','working','freelancer','job_seeker','hr'
ALTER TABLE users ADD COLUMN college      VARCHAR(255);
ALTER TABLE users ADD COLUMN degree       VARCHAR(100);
ALTER TABLE users ADD COLUMN branch       VARCHAR(100);
ALTER TABLE users ADD COLUMN grad_year    INTEGER;
ALTER TABLE users ADD COLUMN experience_years FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN is_premium   BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN premium_plan VARCHAR(20);
ALTER TABLE users ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;
```

---

## SECTION 10: FILE SUMMARY FOR ANTIGRAVITY

```
Files to CREATE or MODIFY:

BACKEND:
├── app/api/routes/search.py          ← Global search endpoint
├── app/api/routes/profile.py         ← Profile view + edit
├── app/api/routes/auth.py            ← Add onboarding complete endpoint
├── app/services/search_service.py    ← Search logic
├── app/services/premium_service.py   ← Premium check middleware

FRONTEND:
├── src/pages/auth/Onboarding.tsx     ← 4-step onboarding flow
├── src/pages/Landing.tsx             ← Full marketing landing page
├── src/pages/Profile.tsx             ← Profile view + edit
├── src/pages/hr/InterviewResults.tsx ← Full interview evaluation view
├── src/components/ui/Skeleton.tsx    ← All skeleton variants
├── src/components/ui/PremiumLock.tsx ← Lock overlay component
├── src/components/search/SearchBar.tsx ← Global search with dropdown
├── src/components/profile/ProfileEdit.tsx ← Edit form
└── src/utils/premium.ts              ← Premium check helpers

FIXES:
├── src/pages/hr/ATSRankings.tsx      ← Fix blank page bug
├── src/pages/ats/ResumeUpload.tsx    ← Add re-upload prompt for non-resume
└── src/components/layout/TopBar.tsx  ← Fix search integration
```

---

*This is the complete upgrade specification for NexHire.*
*Covers: 4 bug fixes + interview results + profiles + onboarding +*
*quick search + skeletons + landing page + premium lock system.*
*Hand this to Antigravity as the full build spec.*
