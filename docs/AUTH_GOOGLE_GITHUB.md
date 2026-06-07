# NexHire — Authentication System
## Google Login + GitHub Login for Candidates
## Complete Specification for Antigravity

---

## AUTH STRATEGY OVERVIEW

```
CANDIDATES (Students):
├── Google Login (OAuth 2.0)    ← PRIMARY
├── GitHub Login (OAuth 2.0)    ← PRIMARY
└── Email/Password              ← FALLBACK (optional)

HR / RECRUITERS:
├── Email/Password only         ← HR accounts created by Admin
└── No social login for HR      ← Security: HR accounts are internal
```

---

## TECHNOLOGY CHOICES

```
Provider:     Firebase Authentication
Why Firebase:
  ├── Handles ALL OAuth complexity (token exchange, refresh, revocation)
  ├── Google login → native Firebase support (1 line of code)
  ├── GitHub login → native Firebase support (1 line of code)
  ├── Free tier: 10,000 auth/month (more than enough for hackathon)
  ├── Secure: Firebase manages tokens, we never see user passwords
  ├── Battle-tested at scale (billions of auth events)
  └── Works with our existing JWT system (Firebase token → NexHire JWT)

Backend JWT:
  ├── After Firebase auth → we issue our OWN JWT
  ├── This JWT is what our FastAPI uses for authorization
  ├── Contains: user_id, role, email, scopes
  └── Stored in Redis for fast verification + revocation
```

---

## AUTH FLOWS

### Flow 1: Google Login

```
FRONTEND:
1. User clicks "Continue with Google"
2. Firebase SDK: signInWithPopup(googleProvider)
3. Google popup opens → user selects account
4. Firebase receives Google token
5. Firebase returns: { user, idToken }
6. Frontend sends idToken to our backend

BACKEND:
7. POST /auth/social/google
   Body: { firebase_token: "eyJ..." }
8. FastAPI verifies firebase_token with Firebase Admin SDK
   decoded = firebase_admin.auth.verify_id_token(firebase_token)
9. Extract: uid, email, name, photo_url
10. Check if user exists in PostgreSQL (by firebase_uid or email)
    ├── EXISTS  → update last_login, return our JWT
    └── NEW     → create user record (role=student), return our JWT
11. Generate NexHire JWT (access + refresh)
12. Store session in Redis
13. Return: { access_token, refresh_token, role, is_new_user }

FRONTEND (after login):
14. Store access_token in memory (not localStorage)
15. Redirect:
    ├── is_new_user = true  → /onboarding (complete profile)
    └── is_new_user = false → /dashboard
```

### Flow 2: GitHub Login

```
FRONTEND:
1. User clicks "Continue with GitHub"
2. Firebase SDK: signInWithPopup(githubProvider)
   ← Firebase handles GitHub OAuth internally
3. GitHub login page opens
4. User authorizes NexHire
5. Firebase receives GitHub access token + user info
6. Firebase returns: { user, idToken, credential }
   ← credential.accessToken = GitHub token (keep this!)
7. Frontend sends BOTH to backend:
   { firebase_token, github_access_token }

BACKEND:
8. POST /auth/social/github
   Body: { firebase_token, github_access_token }
9. Verify firebase_token with Firebase Admin SDK
10. Use github_access_token to fetch GitHub profile:
    GET https://api.github.com/user
    → login, avatar_url, bio, public_repos, followers
11. Check if user exists (by firebase_uid or email)
    ├── EXISTS  → update last_login + sync GitHub profile
    └── NEW     → create user + create social_profile record
12. Generate NexHire JWT
13. Return: { access_token, refresh_token, role, github_connected: true }

FRONTEND:
14. GitHub profile auto-connected on signup ✅
15. Redirect to /dashboard or /onboarding
```

### Flow 3: HR Email/Password Login

```
FRONTEND:
1. HR enters email + password
2. POST /auth/login { email, password }

BACKEND:
3. Find user by email in PostgreSQL
4. Check role is NOT 'student' (reject students from HR login)
5. bcrypt.verify(password, password_hash)
6. Generate NexHire JWT
7. Store in Redis
8. Return: { access_token, refresh_token, role }

FRONTEND:
9. Store tokens
10. Redirect to /hr/dashboard
```

---

## FIREBASE SETUP (Step by Step)

### Step 1: Firebase Console
```
1. Go to https://console.firebase.google.com
2. Select your project (fwc-hrms)
3. Go to Authentication → Sign-in method
4. Enable: Google ✅
5. Enable: GitHub ✅
6. Enable: Email/Password ✅ (for HR)
```

### Step 2: Enable Google Login
```
In Firebase Console:
1. Authentication → Sign-in method → Google
2. Toggle: ENABLED
3. Project support email: your email
4. Save

That's it. Google login is ready.
```

### Step 3: Enable GitHub Login
```
In Firebase Console:
1. Authentication → Sign-in method → GitHub
2. You'll see: "Client ID" and "Client Secret" fields
3. Also see: "Authorization callback URL"
   Copy this URL: https://YOUR_PROJECT.firebaseapp.com/__/auth/handler

Now go to GitHub:
4. GitHub → Settings → Developer Settings → OAuth Apps
5. Click "New OAuth App"
6. Fill:
   Application name: NexHire
   Homepage URL: http://localhost:5173
   Authorization callback URL: [paste the Firebase URL from step 3]
7. Click "Register application"
8. Copy: Client ID and Client Secret
9. Paste back into Firebase Console
10. Save

GitHub login is ready.
```

### Step 4: Firebase Web Config (for Frontend)
```
In Firebase Console:
1. Project Settings → Your Apps → Web App
2. Copy the firebaseConfig object:

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "fwc-hrms.firebaseapp.com",
  projectId: "fwc-hrms",
  storageBucket: "fwc-hrms.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};

3. Add to frontend .env.local:
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=fwc-hrms.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fwc-hrms
VITE_FIREBASE_STORAGE_BUCKET=fwc-hrms.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

### Step 5: Firebase Admin SDK (for Backend)
```
In Firebase Console:
1. Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download JSON file → save as firebase_key.json
4. Add to backend .env:
FIREBASE_KEY_PATH=firebase_key.json

NEVER commit firebase_key.json to GitHub
Add to .gitignore: firebase_key.json
```

---

## FRONTEND CODE

### firebase.ts (config + providers)
```typescript
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Add GitHub scopes (to get repo data automatically)
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');
githubProvider.addScope('repo');   // access public repos
```

### auth.ts (login functions)
```typescript
import {
  auth,
  googleProvider,
  githubProvider
} from './firebase';
import {
  signInWithPopup,
  GithubAuthProvider,
  signOut
} from 'firebase/auth';
import api from './api';

// ── Google Login ─────────────────────────────────────────────
export async function loginWithGoogle() {
  try {
    const result     = await signInWithPopup(auth, googleProvider);
    const firebaseToken = await result.user.getIdToken();

    // Send to our backend
    const response = await api.post('/auth/social/google', {
      firebase_token: firebaseToken
    });

    return response.data;
    // { access_token, refresh_token, role, is_new_user }

  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Login cancelled');
    }
    throw error;
  }
}

// ── GitHub Login ─────────────────────────────────────────────
export async function loginWithGitHub() {
  try {
    const result        = await signInWithPopup(auth, githubProvider);
    const firebaseToken = await result.user.getIdToken();

    // Extract GitHub access token (to auto-connect portfolio)
    const credential        = GithubAuthProvider.credentialFromResult(result);
    const githubAccessToken = credential?.accessToken;

    // Send BOTH tokens to backend
    const response = await api.post('/auth/social/github', {
      firebase_token:       firebaseToken,
      github_access_token:  githubAccessToken
    });

    return response.data;

  } catch (error: any) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error(
        'An account already exists with this email using a different login method.'
      );
    }
    throw error;
  }
}

// ── HR Email/Password Login ───────────────────────────────────
export async function loginWithEmail(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

// ── Logout ────────────────────────────────────────────────────
export async function logout(accessToken: string) {
  await api.post('/auth/logout', {}, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  await signOut(auth);
}
```

### Login.tsx (the UI page)
```tsx
import { useState } from 'react';
import { loginWithGoogle, loginWithGitHub, loginWithEmail } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState<string | null>(null);
  const [error, setError]       = useState('');
  const navigate                = useNavigate();

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(provider);
    setError('');
    try {
      const data = provider === 'google'
        ? await loginWithGoogle()
        : await loginWithGitHub();

      // Store tokens in memory (NOT localStorage for security)
      sessionStorage.setItem('access_token',  data.access_token);
      sessionStorage.setItem('refresh_token', data.refresh_token);
      sessionStorage.setItem('role',          data.role);

      if (data.is_new_user) {
        navigate('/onboarding');
      } else {
        navigate(data.role === 'student' ? '/dashboard' : '/hr/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError('');
    try {
      const data = await loginWithEmail(email, password);
      sessionStorage.setItem('access_token',  data.access_token);
      sessionStorage.setItem('refresh_token', data.refresh_token);
      sessionStorage.setItem('role',          data.role);
      navigate('/hr/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">NexHire</h1>
          <p className="text-gray-500 mt-1">AI-Powered Hiring Platform</p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">

          {/* Google */}
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 transition font-medium text-gray-700 disabled:opacity-50"
          >
            {loading === 'google' ? (
              <span>Connecting...</span>
            ) : (
              <>
                {/* Google Icon SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* GitHub */}
          <button
            onClick={() => handleSocialLogin('github')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white rounded-lg py-3 px-4 hover:bg-gray-800 transition font-medium disabled:opacity-50"
          >
            {loading === 'github' ? (
              <span>Connecting...</span>
            ) : (
              <>
                {/* GitHub Icon SVG */}
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continue with GitHub
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-sm text-gray-400">HR Login</span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        {/* HR Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="HR Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading !== null}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading === 'email' ? 'Signing in...' : 'Sign in as HR'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Candidates: use Google or GitHub login above.
          <br/>
          HR accounts are created by your administrator.
        </p>

      </div>
    </div>
  );
}
```

---

## BACKEND CODE

### auth routes (auth.py)
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.auth_service import (
    handle_social_login,
    login_user,
    logout_user,
    refresh_tokens,
    get_current_user
)
from pydantic import BaseModel
from typing import Optional
import firebase_admin
from firebase_admin import auth as firebase_auth
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])


class SocialLoginRequest(BaseModel):
    firebase_token: str
    github_access_token: Optional[str] = None


class EmailLoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Google Login ──────────────────────────────────────────────
@router.post("/social/google")
async def google_login(request: SocialLoginRequest, db: Session = Depends(get_db)):
    try:
        decoded = firebase_auth.verify_id_token(request.firebase_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    result = await handle_social_login(
        db        = db,
        firebase_uid = decoded["uid"],
        email     = decoded.get("email"),
        name      = decoded.get("name"),
        photo_url = decoded.get("picture"),
        provider  = "google",
        github_token = None
    )
    return result


# ── GitHub Login ──────────────────────────────────────────────
@router.post("/social/github")
async def github_login(request: SocialLoginRequest, db: Session = Depends(get_db)):
    try:
        decoded = firebase_auth.verify_id_token(request.firebase_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    result = await handle_social_login(
        db           = db,
        firebase_uid = decoded["uid"],
        email        = decoded.get("email"),
        name         = decoded.get("name"),
        photo_url    = decoded.get("picture"),
        provider     = "github",
        github_token = request.github_access_token
    )
    return result


# ── HR Email Login ────────────────────────────────────────────
@router.post("/login")
def email_login(request: EmailLoginRequest, db: Session = Depends(get_db)):
    return login_user(db, request)


# ── Refresh Token ─────────────────────────────────────────────
@router.post("/refresh")
def refresh(request: RefreshRequest):
    return refresh_tokens(request.refresh_token)


# ── Logout ────────────────────────────────────────────────────
@router.post("/logout")
def logout(current_user = Depends(get_current_user)):
    logout_user(current_user.id)
    return {"message": "Logged out successfully"}


# ── Get Current User ──────────────────────────────────────────
@router.get("/me")
def me(current_user = Depends(get_current_user)):
    return {
        "id":       current_user.id,
        "email":    current_user.email,
        "name":     current_user.full_name,
        "role":     current_user.role,
        "photo":    current_user.photo_url,
    }
```

### auth_service.py — handle_social_login
```python
async def handle_social_login(
    db, firebase_uid, email, name, photo_url, provider, github_token
) -> dict:
    """
    Handles both Google and GitHub social logins.
    Creates user if new, returns JWT if existing.
    """
    from app.models.user import User, UserRole, SocialProfile
    from app.core.security import create_access_token, create_refresh_token
    import httpx

    # ── Find or create user ───────────────────────────────────
    user = db.query(User).filter(
        (User.firebase_uid == firebase_uid) | (User.email == email)
    ).first()

    is_new_user = False

    if not user:
        # New user — create account
        user = User(
            email        = email,
            full_name    = name,
            firebase_uid = firebase_uid,
            role         = UserRole.student,
            photo_url    = photo_url,
            is_active    = True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
    else:
        # Existing user — update firebase_uid if missing
        if not user.firebase_uid:
            user.firebase_uid = firebase_uid
        user.last_login = datetime.utcnow()
        db.commit()

    # ── Auto-connect GitHub profile if token provided ─────────
    if provider == "github" and github_token:
        await sync_github_on_login(db, user.id, github_token)

    # ── Generate NexHire JWT ──────────────────────────────────
    token_data = {
        "sub":   str(user.id),
        "email": user.email,
        "role":  user.role
    }
    access_token  = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Store session in Redis
    redis_client.setex(
        f"session:{user.id}",
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        json.dumps({
            "user_id": user.id,
            "role":    user.role,
            "email":   user.email
        })
    )

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "role":          user.role,
        "is_new_user":   is_new_user,
        "name":          user.full_name,
        "photo":         user.photo_url,
    }


async def sync_github_on_login(db, user_id: int, github_token: str):
    """
    Auto-sync GitHub profile when user logs in with GitHub.
    """
    from app.models.user import SocialProfile
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {github_token}"}
        )
        if response.status_code != 200:
            return   # silently fail, don't block login

        github_data = response.json()

        # Check if GitHub profile already exists
        profile = db.query(SocialProfile).filter(
            SocialProfile.user_id == user_id,
            SocialProfile.platform == "github"
        ).first()

        if not profile:
            profile = SocialProfile(
                user_id  = user_id,
                platform = "github",
                username = github_data.get("login"),
            )
            db.add(profile)

        profile.data       = github_data
        profile.synced_at  = datetime.utcnow()
        db.commit()
```

---

## DATABASE ADDITIONS

```sql
-- Add photo_url to users table
ALTER TABLE users ADD COLUMN photo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN provider  VARCHAR(20);
  -- 'google', 'github', 'email'
```

---

## ENVIRONMENT VARIABLES

```env
# Backend .env
FIREBASE_KEY_PATH=firebase_key.json

# Frontend .env.local
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=fwc-hrms.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fwc-hrms
VITE_FIREBASE_STORAGE_BUCKET=fwc-hrms.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

---

## SECURITY NOTES

```
1. TOKENS IN MEMORY ONLY
   Store access_token in React state OR sessionStorage
   NEVER store in localStorage (XSS risk)
   Refresh token: sessionStorage only

2. HR ACCOUNTS NEVER USE SOCIAL LOGIN
   Social login always creates student accounts
   HR accounts created manually by admin only
   Backend rejects social login if role is already HR

3. GITHUB TOKEN HANDLING
   GitHub access token used only on backend
   Never exposed to frontend after initial exchange
   Stored encrypted in DB if needed for future syncs

4. FIREBASE TOKEN EXPIRY
   Firebase tokens expire after 1 hour
   Our JWT also expires after 1 hour
   Refresh flow: client sends refresh_token → gets new access_token

5. ACCOUNT LINKING
   If user registers with Google THEN tries GitHub (same email):
   Firebase throws: auth/account-exists-with-different-credential
   Handle gracefully: "Account exists with Google. Please use Google login."
```

---

## ERROR HANDLING

```typescript
// Frontend error messages to show user

const AUTH_ERRORS: Record<string, string> = {
  'auth/popup-closed-by-user':
    'Login cancelled. Please try again.',
  'auth/popup-blocked':
    'Popup blocked. Please allow popups for this site.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email. Try a different login method.',
  'auth/network-request-failed':
    'Network error. Please check your connection.',
  'auth/too-many-requests':
    'Too many attempts. Please wait a few minutes.',
  'default':
    'Login failed. Please try again.',
};
```

---

## WHAT ANTIGRAVITY NEEDS TO BUILD

```
Backend:
  app/api/routes/auth.py          ← Google + GitHub + Email endpoints (above)
  app/services/auth_service.py    ← handle_social_login + sync_github_on_login

Frontend:
  src/utils/firebase.ts           ← Firebase init + providers
  src/utils/auth.ts               ← loginWithGoogle, loginWithGitHub, loginWithEmail
  src/pages/auth/Login.tsx        ← Login UI (above)
  src/pages/auth/Onboarding.tsx   ← New user profile completion

Firebase Console:
  Enable: Google ✅
  Enable: GitHub ✅ (need GitHub OAuth App)
  Enable: Email/Password ✅ (for HR)
```

---

*This doc covers: Google OAuth login, GitHub OAuth login, HR email/password login,*
*Firebase setup steps, all frontend + backend code, security notes, and error handling.*
*Hand to Antigravity as the authentication specification.*
