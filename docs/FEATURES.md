# NexHire — Features

---

## Student / User Side

### Authentication
- Register with email + password
- Login with email + password
- Login with GitHub OAuth
- Login with Google OAuth
- Forgot password (email reset link)
- Token refresh (silent re-auth)
- Logout + token revocation

### Profile
- Update personal details (name, phone, college, major)
- Upload profile picture
- View own dashboard
- View application history

### Social Portfolio
- Connect GitHub (OAuth)
- Connect LeetCode (username)
- Connect CodeForces (handle)
- Connect LinkedIn (OAuth)
- View aggregated Developer Score (0–1000)
- View GitHub stats: repos, stars, languages, top projects
- View LeetCode stats: total solved, easy/medium/hard breakdown
- View CodeForces stats: rating, rank, contests
- Achievement badges (auto-generated)
- Public shareable portfolio link
- Manual sync trigger

### Jobs
- Browse open job postings
- Search jobs by title or skill
- View job details
- Apply to a job (resume + portfolio)
- Withdraw application
- Track application status (applied, screening, interviewed, offered, rejected)

### AI Resume Screening
- Upload resume (PDF or paste text)
- Get AI score (0–100) against job description
- View strengths (top 3)
- View gaps (top 2)
- View recommendation (hire / maybe / reject)
- Get AI improvement suggestions

### AI Chatbot Interview
- Start chatbot screening interview for applied job
- Multi-turn conversation (context-aware AI)
- View own interview transcript
- See sentiment tags per message

### Notifications
- Email: application received confirmation
- Email: status update (screening started, offer made)
- In-app: new matching job posted
- In-app: interview scheduled

---

## HR / Recruiter Side

### Authentication
- Login as recruiter / manager / admin
- Role-based dashboard routing
- Manage team user roles (admin only)

### Candidate Management
- View all candidates with filters (status, score, date)
- View candidate full profile (social portfolio + resume score + chat)
- Sort candidates by composite score
- Update candidate status manually
- Add recruiter notes

### Job Management
- Create job postings (title, description, required skills)
- Edit / delete job postings
- Publish / unpublish jobs
- View all applications per job
- Export candidate list (CSV)

### AI Resume Screening (HR View)
- Bulk upload resumes → auto-screen all
- View screening results sorted by score
- Filter: hire / maybe / reject
- View per-candidate breakdown (strengths, gaps, score)
- Download screening report

### AI Chatbot (HR View)
- View full conversation transcript per candidate
- View sentiment analysis (per message + overall)
- View interview score
- Flag candidates for next round

### Employee Management
- Add / edit / deactivate employee profiles
- View employee list (filter by department, role)
- Mark attendance (present / absent / leave)
- View attendance history per employee
- Calculate attendance percentage

### AI Performance Insights
- View AI-generated performance summary per employee
- See anomaly flags (attendance drop, rating fall, declining trend)
- View trend analysis (improving / stable / declining)
- Company-wide performance overview
- Team performance comparison

### AI Payroll Recommendations
- View salary table (all employees)
- View AI-recommended salary adjustment per employee
- View reasoning behind each recommendation
- Approve or reject recommendation
- Track adjustment history
- Generate payslip (basic)

### Analytics & Reports
- Hiring funnel chart (applied → screened → interviewed → offered)
- Time-to-hire metrics
- Top skills in candidate pipeline
- Resume score distribution
- Attendance trend chart
- Performance distribution chart
- Export reports (PDF / CSV)

---

## Admin Side

### All HR features +
- Manage all user accounts (view, activate, deactivate, delete)
- Assign / change user roles
- View system-wide analytics
- View audit logs (who did what, when)
- Manage job postings across all recruiters
- Access full payroll data
- Configure system settings

---

## AI Features Summary (4 Core)

| # | Feature | Input | Output |
|---|---------|-------|--------|
| 1 | Resume Screening | Resume text + Job description | Score, strengths, gaps, recommendation |
| 2 | Candidate Chatbot | Candidate message + history | Follow-up question + sentiment |
| 3 | Performance Insights | Employee metrics (6 months) | Summary + anomaly flags + trends |
| 4 | Payroll Recommendations | Performance + attendance + tenure | Adjustment % + reasoning |

---

## Social Integration Features

| Platform | What We Show |
|----------|-------------|
| GitHub | Repos count, stars, top 5 projects, languages, contributions |
| LeetCode | Total solved, easy/medium/hard, contest rating |
| CodeForces | Current rating, rank, problems solved, contests |
| LinkedIn | Name, headline, current role, skills |
| Combined | Developer Score (0–1000), achievement badges |

---

## Roles & Access Summary

| Feature | Student | Recruiter | Manager | Admin |
|---------|---------|-----------|---------|-------|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Apply to jobs | ✅ | ❌ | ❌ | ✅ |
| Connect social profiles | ✅ | ❌ | ❌ | ✅ |
| View all candidates | ❌ | ✅ | ✅ | ✅ |
| Screen resumes | ❌ | ✅ | ✅ | ✅ |
| View chat transcripts | Own only | ✅ All | ✅ | ✅ |
| Create jobs | ❌ | ✅ | ✅ | ✅ |
| View employees | ❌ | ❌ | ✅ Team | ✅ All |
| Performance insights | ❌ | ❌ | ✅ | ✅ |
| Payroll | ❌ | ❌ | View only | ✅ Full |
| User management | ❌ | ❌ | ❌ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ✅ |
