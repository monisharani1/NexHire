# NexHire — System Architecture & CAP Theorem

---

## CAP Theorem Position

CAP Theorem states a distributed system can only guarantee 2 of 3:
- **C**onsistency — every read gets the latest write
- **A**vailability — every request gets a response
- **P**artition Tolerance — system works despite network failures

### NexHire's Choice: **CP (Consistency + Partition Tolerance)**

**Why CP over AP:**

| Feature | Why Consistency Matters |
|---------|------------------------|
| Payroll | Salary data must be exact — no stale reads |
| Offer Letters | Can't send two offers to same candidate |
| Auth Tokens | Revoked token must be revoked everywhere immediately |
| Resume Scores | Score must reflect latest job description |

**Tradeoff accepted:**
- Brief unavailability during network partition is acceptable
- We never sacrifice data correctness for availability
- Redis gives eventual consistency for non-critical data (social profiles, cache)

### Per-Component CAP Decisions:

| Component | CAP Choice | Reason |
|-----------|-----------|--------|
| PostgreSQL (payroll, auth) | CP | ACID, financial data |
| Redis (sessions, cache) | AP | Speed > consistency for cache |
| Social profile sync | AP | Stale GitHub data for 6h is fine |
| Chatbot history | CP | Conversation must be complete |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├──────────────────────────┬──────────────────────────────────────┤
│   Student App (React)    │        HR App (React)                │
│   1000 concurrent users  │        200 concurrent users          │
└──────────────┬───────────┴───────────────┬──────────────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CDN (Cloudflare)                            │
│              Static assets, DDoS protection                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Load Balancer (nginx)                         │
│         Round-robin across FastAPI instances                    │
└──────┬───────────────┬───────────────┬──────────────────────────┘
       │               │               │
       ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ FastAPI  │    │ FastAPI  │    │ FastAPI  │
│ Worker 1 │    │ Worker 2 │    │ Worker 3 │
│ (async)  │    │ (async)  │    │ (async)  │
└──────┬───┘    └──────┬───┘    └──────┬───┘
       │               │               │
       └───────────────┼───────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Redis   │ │  Claude API  │
│  (Primary)   │ │ (Cache + │ │  (AI Layer)  │
│              │ │Sessions) │ │              │
└──────┬───────┘ └──────────┘ └──────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Replica)   │
│  Read-only   │
└──────────────┘
```

---

## Request Flow

### Student Login:
```
1. POST /auth/login {email, password}
2. Load Balancer → FastAPI Worker
3. FastAPI → PostgreSQL (verify user)
4. bcrypt verify password
5. Generate JWT (access + refresh)
6. Store session in Redis (TTL: 1hr)
7. Return JWT to client
8. Client stores JWT in memory
```

### Resume Screening:
```
1. POST /api/resume/screen {resume_text, job_id}
2. Auth middleware → Redis (verify JWT, 1ms)
3. Fetch job description from PostgreSQL
4. Send to Claude API (async, non-blocking)
5. Claude returns score + insights (JSON)
6. Store result in PostgreSQL
7. Return to client
```

### Social Profile Sync:
```
1. User connects GitHub (OAuth flow)
2. Firebase handles OAuth token exchange
3. Background job queued in Redis
4. Worker fetches GitHub API (async)
5. Normalize + store in PostgreSQL (JSONB)
6. Cache in Redis (TTL: 6 hours)
7. Portfolio score calculated
```

---

## Database Schema

```sql
-- USERS (students + HR)
users
├── id (PK)
├── email (UNIQUE, INDEX)
├── username (UNIQUE)
├── password_hash
├── role (ENUM: student, recruiter, manager, admin)
├── is_active
├── created_at
└── last_login

-- SOCIAL PROFILES
social_profiles
├── id (PK)
├── user_id (FK → users, INDEX)
├── platform (github, leetcode, codeforces)
├── username
├── data (JSONB)
├── portfolio_score
└── synced_at

-- JOBS
jobs
├── id (PK)
├── title
├── description (TEXT)
├── required_skills (TEXT[])
├── created_by (FK → users)
├── is_active
└── created_at

-- CANDIDATES
candidates
├── id (PK)
├── user_id (FK → users)
├── job_id (FK → jobs)
├── status (ENUM: applied, screening, interviewed, offered, rejected)
├── resume_score
├── portfolio_score
└── created_at

-- RESUMES
resumes
├── id (PK)
├── candidate_id (FK → candidates)
├── file_path
├── extracted_text (TEXT)
├── score (0-100)
├── strengths (TEXT[])
├── gaps (TEXT[])
├── recommendation (hire/maybe/reject)
└── created_at

-- CHAT MESSAGES
chat_messages
├── id (PK)
├── candidate_id (FK → candidates, INDEX)
├── role (user/assistant)
├── message (TEXT)
├── sentiment (positive/neutral/negative)
└── created_at (INDEX)

-- EMPLOYEES
employees
├── id (PK)
├── user_id (FK → users)
├── department
├── designation
├── salary
├── joining_date
└── manager_id (FK → employees)

-- PERFORMANCE
performance_records
├── id (PK)
├── employee_id (FK → employees, INDEX)
├── metric (attendance/rating/projects)
├── value
└── recorded_at (INDEX)

-- PAYROLL
payroll
├── id (PK)
├── employee_id (FK → employees)
├── month
├── base_salary
├── deductions
├── net_salary
├── status (pending/processed/paid)
└── processed_at
```

---

## Security Architecture

```
Layer 1: Network
├── HTTPS (TLS 1.3) everywhere
├── Cloudflare DDoS protection
└── Rate limiting (nginx: 100 req/min per IP)

Layer 2: Auth
├── JWT (HMAC-SHA256, 1hr TTL)
├── Refresh tokens (7 days)
├── Redis token revocation
└── bcrypt password hashing (12 rounds)

Layer 3: API
├── Role-based access control (RBAC)
├── Input validation (Pydantic v2)
├── SQL injection prevention (SQLAlchemy ORM)
└── XSS prevention (sanitize all inputs)

Layer 4: Data
├── PostgreSQL encrypted at rest
├── No secrets in codebase (.env only)
├── Firebase handles OAuth secrets
└── Audit logs (who did what, when)
```

---

## Scaling Strategy

```
Current (MVP):
├── 1 FastAPI instance
├── 1 PostgreSQL instance
└── 1 Redis instance
→ Handles: ~300 concurrent users

Growth (1200 concurrent):
├── 4 FastAPI instances (nginx LB)
├── PostgreSQL primary + 1 replica
└── Redis cluster
→ Handles: 1200+ concurrent users

Future (10,000+ users):
├── 8+ FastAPI instances (auto-scaling)
├── PostgreSQL primary + 2 replicas + read replica
├── Redis cluster (6 nodes)
└── Elasticsearch (full-text search)
→ Handles: 10,000+ concurrent users
```
