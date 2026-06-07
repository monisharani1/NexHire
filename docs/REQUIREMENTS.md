# NexHire — Functional & Non-Functional Requirements

---

## FUNCTIONAL REQUIREMENTS

---

### MODULE 1: Authentication & User Management

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-01 | Register with email + password | All | P0 |
| F-02 | Login with email + password | All | P0 |
| F-03 | Login with GitHub OAuth | All | P0 |
| F-04 | Login with Google OAuth | All | P1 |
| F-05 | Forgot password (email reset) | All | P1 |
| F-06 | Update profile (name, phone, college) | All | P1 |
| F-07 | Role-based dashboard routing | All | P0 |
| F-08 | Token refresh (silent re-auth) | All | P0 |
| F-09 | Logout + token revocation | All | P0 |
| F-10 | Admin: manage user roles | Admin | P1 |

---

### MODULE 2: Social Platform Integration

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-11 | Connect GitHub account (OAuth) | Student | P0 |
| F-12 | Connect LeetCode (username) | Student | P0 |
| F-13 | Connect CodeForces (handle) | Student | P1 |
| F-14 | Connect LinkedIn (OAuth) | Student | P2 |
| F-15 | Auto-sync profiles every 6 hours | System | P1 |
| F-16 | Manual sync trigger | Student | P2 |
| F-17 | Display GitHub stats (repos, stars, languages) | Student | P0 |
| F-18 | Display LeetCode stats (solved, rating) | Student | P0 |
| F-19 | Display CodeForces stats (rating, rank) | Student | P1 |
| F-20 | Calculate overall Developer Score (0–1000) | System | P0 |
| F-21 | Display achievement badges | Student | P1 |
| F-22 | Public shareable portfolio link | Student | P2 |
| F-23 | Top GitHub projects showcase | Student | P0 |

---

### MODULE 3: Job Management

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-24 | Create job posting | Recruiter/Admin | P0 |
| F-25 | Edit/delete job posting | Recruiter/Admin | P0 |
| F-26 | Browse open jobs | Student | P0 |
| F-27 | Search jobs by title/skill | Student | P1 |
| F-28 | Apply to job (resume + portfolio) | Student | P0 |
| F-29 | Withdraw application | Student | P1 |
| F-30 | View application status | Student | P0 |
| F-31 | View all applications per job | Recruiter | P0 |
| F-32 | Filter candidates by status/score | Recruiter | P0 |
| F-33 | Publish/unpublish jobs | Recruiter/Admin | P1 |

---

### MODULE 4: AI Resume Screening

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-34 | Upload resume (PDF/text) | Student/Recruiter | P0 |
| F-35 | Extract text from PDF | System | P0 |
| F-36 | AI score resume vs job description (0–100) | System | P0 |
| F-37 | Display strengths (top 3) | System | P0 |
| F-38 | Display gaps (top 2) | System | P0 |
| F-39 | Recommendation: hire/maybe/reject | System | P0 |
| F-40 | Bulk upload + screen resumes | Recruiter | P1 |
| F-41 | Sort candidates by resume score | Recruiter | P0 |
| F-42 | Store screening history | System | P1 |
| F-43 | AI improvement suggestions for student | Student | P2 |

---

### MODULE 5: AI Candidate Chatbot

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-44 | Start chatbot screening interview | Candidate | P0 |
| F-45 | Multi-turn conversation (context-aware) | System | P0 |
| F-46 | AI adapts questions based on responses | System | P0 |
| F-47 | Sentiment analysis per message | System | P0 |
| F-48 | Store full conversation history | System | P0 |
| F-49 | HR view: full transcript + sentiment | Recruiter | P0 |
| F-50 | Overall interview sentiment score | System | P1 |
| F-51 | Auto-trigger chatbot on application | System | P2 |

---

### MODULE 6: Employee Management

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-52 | Add/edit/delete employee profiles | Admin/Manager | P0 |
| F-53 | View employee list (with filters) | Manager/Admin | P0 |
| F-54 | Mark attendance (present/absent) | Manager/Admin | P0 |
| F-55 | View attendance history | All | P0 |
| F-56 | Calculate attendance percentage | System | P0 |
| F-57 | Add performance rating | Manager | P0 |
| F-58 | View performance history | Manager/Admin | P0 |
| F-59 | Employee self-view dashboard | Employee | P0 |
| F-60 | Export employee data (CSV) | Admin | P2 |

---

### MODULE 7: AI Performance Insights

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-61 | Aggregate performance metrics | System | P0 |
| F-62 | Claude-generated performance summary | System | P0 |
| F-63 | Anomaly detection (attendance drop, rating fall) | System | P0 |
| F-64 | Flag display on dashboard | Manager/Admin | P0 |
| F-65 | Trend analysis (improving/declining/stable) | System | P1 |
| F-66 | Team-wide performance overview | Manager | P1 |
| F-67 | Comparison vs peer average | System | P2 |

---

### MODULE 8: AI Payroll Recommendations

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-68 | View salary table | HR/Admin | P0 |
| F-69 | AI salary adjustment recommendation | System | P0 |
| F-70 | Reasoning for recommendation (Claude) | System | P0 |
| F-71 | Approve/reject recommendation | Manager/Admin | P1 |
| F-72 | Track adjustment history | System | P1 |
| F-73 | Generate payslip | Admin | P2 |
| F-74 | Market rate benchmarking | System | P2 |

---

### MODULE 9: Analytics & Reporting

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-75 | Hiring funnel visualization | Recruiter/Admin | P1 |
| F-76 | Time-to-hire metrics | Admin | P1 |
| F-77 | Top skills in candidate pipeline | Recruiter | P1 |
| F-78 | Resume score distribution chart | Recruiter | P1 |
| F-79 | Attendance trend chart | Manager | P1 |
| F-80 | Performance distribution chart | Manager | P1 |
| F-81 | Export reports (PDF/CSV) | Admin | P2 |

---

### MODULE 10: Notifications

| ID | Feature | Role | Priority |
|----|---------|------|----------|
| F-82 | Email: application received | Student | P1 |
| F-83 | Email: status update (screening, offer) | Student | P1 |
| F-84 | In-app: new job posted | Student | P2 |
| F-85 | In-app: interview scheduled | Student | P1 |
| F-86 | Email: new application (to recruiter) | Recruiter | P1 |

---

## NON-FUNCTIONAL REQUIREMENTS

---

### Performance

| ID | Requirement | Target |
|----|------------|--------|
| NF-01 | Concurrent student logins | 1000 simultaneous |
| NF-02 | Concurrent HR logins | 200 simultaneous |
| NF-03 | API response time (p95) | < 200ms |
| NF-04 | API response time (p99) | < 500ms |
| NF-05 | Resume screening time | < 10 seconds |
| NF-06 | Chatbot response time | < 3 seconds |
| NF-07 | Page load time | < 2 seconds |
| NF-08 | Social profile sync | < 5 seconds |
| NF-09 | Database query time | < 50ms |
| NF-10 | Token verification | < 1ms (Redis) |

---

### Scalability

| ID | Requirement | Target |
|----|------------|--------|
| NF-11 | Horizontal scaling | Add FastAPI instances without downtime |
| NF-12 | Database read scaling | Read replicas for reporting queries |
| NF-13 | Stateless API | No session on server (JWT) |
| NF-14 | Max employee records | 10,000+ without degradation |
| NF-15 | Max candidate records | 50,000+ without degradation |

---

### Availability

| ID | Requirement | Target |
|----|------------|--------|
| NF-16 | Uptime SLA | 99.5% |
| NF-17 | Recovery Time Objective (RTO) | < 5 minutes |
| NF-18 | Recovery Point Objective (RPO) | < 1 minute |
| NF-19 | Health checks | Every 10 seconds |
| NF-20 | Auto-restart on crash | Yes (process manager) |

---

### Security

| ID | Requirement | Target |
|----|------------|--------|
| NF-21 | Password hashing | bcrypt (12 rounds) |
| NF-22 | Token signing | HMAC-SHA256 |
| NF-23 | Transport security | HTTPS / TLS 1.3 |
| NF-24 | Rate limiting (login) | 5 attempts/min/IP |
| NF-25 | Rate limiting (API) | 100 req/min/user |
| NF-26 | SQL injection prevention | SQLAlchemy ORM |
| NF-27 | XSS prevention | Input sanitization |
| NF-28 | CORS | Allowed origins only |
| NF-29 | Secrets management | .env, never in code |
| NF-30 | Audit logging | All write operations logged |

---

### Maintainability

| ID | Requirement | Target |
|----|------------|--------|
| NF-31 | Code coverage (unit tests) | > 80% |
| NF-32 | API documentation | Auto-generated (Swagger) |
| NF-33 | Type safety | TypeScript (frontend), mypy (backend) |
| NF-34 | DB migrations | Alembic versioned migrations |
| NF-35 | CI/CD | GitHub Actions (test + deploy) |
| NF-36 | Linting | Ruff (Python), ESLint (TypeScript) |

---

### Usability

| ID | Requirement | Target |
|----|------------|--------|
| NF-37 | Responsive design | Mobile + tablet + desktop |
| NF-38 | Accessibility | WCAG 2.1 AA |
| NF-39 | Loading states | Skeleton screens + spinners |
| NF-40 | Error messages | User-friendly, actionable |
| NF-41 | Browser support | Chrome, Firefox, Safari, Edge |

---

## Priority Legend
- **P0** — Must have (MVP, launch blocker)
- **P1** — Should have (important but not launch blocker)
- **P2** — Nice to have (post-launch)
