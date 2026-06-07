# NexHire — Tech Stack & Justification

## Overview
NexHire is an AI-powered HRMS built to handle:
- 1000 concurrent student/user logins
- 200 concurrent HR logins
- Social platform integrations (GitHub, LeetCode, CodeForces)
- AI-driven resume screening, chatbot, insights, payroll recommendations

---

## Backend

### FastAPI (Python 3.11)
**Why:**
- Native async/await — handles 1000+ concurrent connections without blocking
- Best Python ecosystem for AI/ML (Claude API, pdfplumber, pandas)
- Auto-generates Swagger/OpenAPI docs
- Pydantic v2 for strict type validation
- Battle-tested at scale (Netflix, Uber use Python async APIs)

**Alternative rejected:** Node.js/Express — weaker AI/ML library support

---

## Database

### PostgreSQL 16 (Primary)
**Why:**
- ACID compliance — critical for payroll, salary, offer letters (no data loss)
- Native relational model — employees, candidates, jobs are naturally relational
- JSONB columns — store social profile data flexibly
- Handles 10,000+ concurrent queries with connection pooling
- Industry standard for enterprise HR systems

**Alternative rejected:** MongoDB — good for flexibility but risky for financial data (payroll)

### Redis 7 (Cache + Sessions)
**Why:**
- Sub-millisecond token verification (critical for 1200 concurrent users)
- Session storage — JWT revocation list
- Rate limiting — prevent brute force on auth endpoints
- Job queues — async social profile sync

---

## Authentication

### JWT (JSON Web Tokens) — Primary Auth
- Access Token: 1 hour TTL
- Refresh Token: 7 days TTL
- Stored in Redis for revocation support
- HMAC-SHA256 signing

### Firebase Auth — Social OAuth
- GitHub OAuth 2.0
- Google OAuth 2.0
- Handles token exchange, social login flow
- Firebase Admin SDK verifies tokens server-side

### Combined Flow:
```
User login (email+pass) → bcrypt verify → JWT issued → Redis stored
User login (GitHub)     → Firebase OAuth → Firebase token → JWT issued
Every API request       → JWT verified   → Redis check   → Serve
```

---

## AI Layer

### Claude API (Anthropic)
- Resume screening & scoring
- Candidate chatbot (multi-turn)
- Performance insight generation
- Payroll recommendation reasoning

**Why Claude over GPT:**
- Superior instruction following
- Better JSON output reliability
- Free tier available

---

## Frontend

### React 18 + TypeScript + Vite
- TypeScript — type safety, fewer runtime bugs
- Vite — fastest dev build tool
- TailwindCSS — utility-first, rapid UI development
- React Query — server state management, caching, background refetch
- React Router v6 — client-side routing

---

## Deployment

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | Vercel | Free, auto-deploy from GitHub |
| Backend | Render | Free tier, Docker support |
| Database | Railway / Neon | Managed PostgreSQL, free tier |
| Cache | Redis Cloud | Managed Redis, free tier |
| CI/CD | GitHub Actions | Auto test + deploy on push |

---

## Social Integrations

| Platform | Method | Data Fetched |
|----------|--------|-------------|
| GitHub | OAuth 2.0 (official) | Repos, stars, languages, contributions |
| LeetCode | GraphQL API (unofficial) | Problems solved, rating, contest rank |
| CodeForces | REST API (public) | Rating, problems solved, contests |
| LinkedIn | OAuth 2.0 | Profile, experience, skills |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Concurrent student logins | 1000 |
| Concurrent HR logins | 200 |
| API response time (p95) | < 200ms |
| Resume screening | < 10s |
| Chatbot response | < 3s |
| Page load | < 2s |
| Uptime SLA | 99.5% |
