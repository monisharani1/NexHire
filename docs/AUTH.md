# NexHire — Authentication Design

---

## Overview

NexHire uses a **dual-layer authentication system:**
1. **JWT** — primary auth for all API requests
2. **Firebase Auth** — social OAuth (GitHub, Google)

---

## Auth Flow Diagrams

### Email/Password Login
```
Client                    FastAPI                  PostgreSQL    Redis
  │                          │                         │           │
  │── POST /auth/login ──────▶│                         │           │
  │   {email, password}       │                         │           │
  │                          │── SELECT user ──────────▶│           │
  │                          │◀─ user data ─────────────│           │
  │                          │                         │           │
  │                          │── bcrypt.verify() ──────▶│           │
  │                          │◀─ True/False ────────────│           │
  │                          │                         │           │
  │                          │── generate JWT ──────────────────────│
  │                          │── SET session:user_id ───────────────▶│
  │                          │                         │           │
  │◀─ {access_token,         │                         │           │
  │    refresh_token} ───────│                         │           │
```

### GitHub OAuth Login
```
Client              FastAPI           Firebase          GitHub
  │                    │                  │               │
  │── GET /auth/github ▶│                  │               │
  │                    │── redirect ──────▶│               │
  │                    │                  │── OAuth ──────▶│
  │                    │                  │◀─ auth code ───│
  │                    │                  │── exchange ───▶│
  │                    │                  │◀─ access token─│
  │                    │◀─ firebase token ─│               │
  │                    │── verify token    │               │
  │                    │── create/get user │               │
  │                    │── generate JWT    │               │
  │◀─ {access_token,   │                  │               │
  │    refresh_token}──│                  │               │
```

### Every API Request
```
Client                FastAPI              Redis
  │                      │                   │
  │── GET /api/xxx ───────▶│                   │
  │   Bearer: <JWT>        │                   │
  │                      │── verify JWT sig   │
  │                      │── GET session:id ──▶│
  │                      │◀─ session data ─────│
  │                      │── check role/scope  │
  │                      │── handle request    │
  │◀─ response ───────────│                   │
```

---

## JWT Token Structure

### Access Token (1 hour)
```json
{
  "iss": "nexhire-api",
  "sub": "user_12345",
  "email": "student@college.edu",
  "role": "student",
  "scopes": ["read:profile", "write:applications"],
  "iat": 1717806000,
  "exp": 1717809600
}
```

### Refresh Token (7 days)
```json
{
  "iss": "nexhire-api",
  "sub": "user_12345",
  "type": "refresh",
  "iat": 1717806000,
  "exp": 1718410800
}
```

---

## Role-Based Access Control (RBAC)

### Roles & Permissions

| Endpoint | Student | Recruiter | Manager | Admin |
|----------|---------|-----------|---------|-------|
| GET /profile | ✅ Own | ✅ All | ✅ All | ✅ All |
| POST /apply | ✅ | ❌ | ❌ | ✅ |
| GET /candidates | ❌ | ✅ | ✅ | ✅ |
| POST /resume/screen | ❌ | ✅ | ✅ | ✅ |
| GET /chat | ✅ Own | ✅ All | ✅ | ✅ |
| GET /employees | ❌ | ❌ | ✅ Team | ✅ All |
| GET /payroll | ❌ | ❌ | ✅ View | ✅ Full |
| POST /jobs | ❌ | ✅ | ✅ | ✅ |
| DELETE /users | ❌ | ❌ | ❌ | ✅ |

---

## Security Measures

### Password Hashing
```python
# bcrypt with 12 rounds
bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
```

### Rate Limiting
```
Login endpoint:     5 attempts / minute / IP
Register endpoint:  3 attempts / minute / IP
API endpoints:      100 requests / minute / user
Social sync:        1 sync / 6 hours / user
```

### Token Revocation
```
On logout:
  Redis: SET revoked:token_jti "1" EX 3600
  
On every request:
  Redis: GET revoked:token_jti
  If exists → 401 Unauthorized
```

---

## Endpoints

```
POST /auth/register          Register new user
POST /auth/login             Email/password login
POST /auth/refresh           Refresh access token
POST /auth/logout            Revoke tokens
GET  /auth/me                Get current user
GET  /auth/github            GitHub OAuth redirect
GET  /auth/github/callback   GitHub OAuth callback
GET  /auth/google            Google OAuth redirect
GET  /auth/google/callback   Google OAuth callback
POST /auth/forgot-password   Send reset email
POST /auth/reset-password    Reset with token
```

---

## Environment Variables Required

```env
SECRET_KEY=<random 64-char string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
FIREBASE_KEY_PATH=firebase_key.json
FIREBASE_WEB_API_KEY=<from Firebase console>
GITHUB_CLIENT_ID=<from GitHub OAuth app>
GITHUB_CLIENT_SECRET=<from GitHub OAuth app>
REDIS_URL=redis://localhost:6379
```
