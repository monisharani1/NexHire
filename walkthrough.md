# NexHire — Candidate Google Auth, Social Integration & AI Interview Portal

Welcome to the comprehensive feature and implementation documentation for **NexHire**! This document provides a complete guide to the updated authentication controls, candidate experiences, AI Video Interview module, and deterministic stats simulation algorithms.

---

## 🔒 1. Authentication & Role Restrictions

To separate talent acquisition from corporate staff management, the login system has been updated with role-based policies:

### 💼 Corporate Staff Login
*   **Roles Included**: `HR Manager`, `System Admin`, `Team Lead`, `Regular Employee`.
*   **Authentication Flow**: Must log in using company credentials (corporate email and password).
*   **Role Switcher Dropdown**: To simplify local developer testing, a role switcher dropdown has been integrated into the **Sign In** tab. Selecting a profile (e.g. *System Admin*) automatically populates the input fields with the default seed email (`admin@enterprise.com`) and password (`password`), allowing you to sign in quickly without cluttering the UI.

### 🎓 Job Candidate Sign-In
*   **Authentication Flow**: Dedicated exclusively to Google Login.
*   **Enforcement**: 
    *   The backend endpoint `POST /api/auth/google` verifies the incoming email payload. If a corporate domain email is provided (such as `hr@enterprise.com` or any email ending in `@enterprise.com` that doesn't start with `candidate`), the server returns a `400 Bad Request` blocking sign-in.
    *   The frontend displays a clear security alert: *"Google Login is restricted to Job Candidates. Corporate accounts must sign in using company credentials."*
    *   When a candidate logs in via Google, their user account is automatically registered on the fly (with `password_hash = None`), and an active candidate record is seeded in the database so they immediately appear in the HR recruitment dashboard.

---

## 🎨 2. Job Candidate Portal

When a Job Candidate logs in (using Google or email), they are securely redirected to the **Candidate Portal** (`#/recruitment`):

### 📈 Application timeline tracker
*   A sleek, reactive timeline representing the candidate's hiring stage: `Applied` ➔ `Screening` ➔ `Interviewing` ➔ `Offered` (or a clear rejection banner if they are marked `rejected`).
*   Shows their composite scorecard ratings:
    *   **ATS Match Score** (parsed from their resume content).
    *   **Portfolio Score** (calculated from their connected developer profiles).
    *   **Interview Score** (recorded from their completed AI Video Interview).

### 🔗 Developer Portfolio Integrations
*   Allows candidates to link **GitHub** and **LeetCode** accounts.
*   **Deterministic Mock Stats**: In order to avoid random or confusing stats, the backend computes profile data deterministically from the characters in the username. Syncing or reconnecting the same username will always yield the exact same metrics (repos count, stars, language diversity, solved problems, contest rating).
*   **Earned Badges**: Rewards candidates with custom achievements (e.g., *Prolific Developer*, *LeetCode Knight*) when their stats exceed specific thresholds.

### 💼 Opportunities Explorer
*   Allows candidates to browse active job openings at the company.
*   Enforces a **1 application maximum limit** to prevent candidates from spamming multiple positions. If they have already applied, the apply button locks with the status *Locked (1 application max)*.

---

## 📹 3. Secure AI Video Interview Portal

When a candidate reaches the `Interviewing` stage, a **Start Your AI Video Interview** button appears on their portal, routing them to the AI Video Interview page (`#/interview`):

*   **Security Lock**: If logged in as a `Candidate`, the candidate selection dropdown is hidden to prevent users from viewing other applicants or taking an interview on behalf of someone else. The system locks the session directly onto the logged-in candidate's profile.
*   **Standardized Questions**: Runs the candidate through a sequence of 4 technical and behavioral screening questions.
*   **Live AI Scanner HUD**:
    *   Simulates real-time face gaze and speech tracking, showing progress bars for: *Confidence Level*, *Technical Accuracy*, *Eye Contact Tracking*, and *Speech Clarity*.
    *   **Telemetry Stabilization**: The telemetry indicators fluctuate naturally by $\pm 1\%$ to $\pm 2\%$ during the mock recording (instead of jumping wildly and randomly) to provide a realistic experience.
*   **Score Sync**: Upon completing the 4 questions, a composite interview score is calculated and saved to the backend database.

---

## 🔬 4. Dynamic Recruiter ATS Scanner Sandbox

On the Recruiter/HR leader board (`#/recruitment`):
*   HR managers can view the full leaderboard, adjust stages, and run the **ATS Scanner** on pending resumes.
*   **Dynamic Matching**: Rather than using the same hardcoded resume text for every applicant, the **Scan ATS** trigger dynamically generates a custom resume string tailored to the candidate's name and applied position.
*   The backend heuristic algorithm parses this dynamic text against the job requirements, resulting in realistic, role-specific match scores and itemized key match details on the dashboard.

---

## 📁 5. Key Codebases & Files Affected

### 🖥️ Backend (API & Models)
*   [social.py](file:///c:/NexHire/backend/app/api/routes/social.py): Integrated `get_deterministic_stats` to compute stable, repeatable portfolio details using a username character hash.
*   [auth_service.py](file:///c:/NexHire/backend/app/services/auth_service.py): Handled on-the-fly candidate registration and automated job application mapping for Google sign-in.
*   [auth.py](file:///c:/NexHire/backend/app/api/routes/auth.py): Exposed the `/google` auth endpoint.
*   [user.py](file:///c:/NexHire/backend/app/models/user.py): Defined schemas for the Google sign-in request payload.

### 💻 Frontend (Vite & React)
*   [Login.tsx](file:///c:/NexHire/hreasy/src/pages/Login.tsx): Built the **NexHire** branding, credentials role selector dropdown, password autofill, Google Sign-In pop-up modal, and instant simulated logins.
*   [Recruitment.tsx](file:///c:/NexHire/hreasy/src/pages/Recruitment.tsx): Created the candidate timeline, GitHub/LeetCode sync panel, locked openings list, and dynamic ATS scanning parameter mapping.
*   [AIInterview.tsx](file:///c:/NexHire/hreasy/src/pages/AIInterview.tsx): Implemented the candidate lock, read-only dashboard prompt, and stabilized HUD telemetry metrics.
*   [App.tsx](file:///c:/NexHire/hreasy/src/App.tsx): Added a post-login redirect filter to route logged-in users away from the `#/login` route directly to their default portals.
*   [Sidebar.tsx](file:///c:/NexHire/hreasy/src/components/Sidebar.tsx) & [Header.tsx](file:///c:/NexHire/hreasy/src/components/Header.tsx): Re-branded titles and logos to **NexHire**.

---

## 🚦 6. Verification Steps

1.  **Start both servers**:
    *   **Backend**: `python -m uvicorn app.main:app --reload`
    *   **Frontend**: `npm run dev`
2.  **Verify Staff Role Login**:
    *   Go to `http://localhost:5173/`.
    *   Under the **Select Your Role** dropdown, choose `HR Manager`.
    *   Click **Sign In to Suite** (the credentials are automatically filled and you can review them).
    *   Confirm you land on the HR Dashboard.
3.  **Verify Candidate Google Auth**:
    *   Log out of the dashboard.
    *   Click **Sign In with Google**.
    *   Click **Candidate Vance** (`candidate@enterprise.com`).
    *   Confirm you are logged in instantly and redirected directly to the Candidate Portal (`#/recruitment`).
4.  **Verify GitHub/LeetCode Sync**:
    *   Connect GitHub and LeetCode using a test username.
    *   Note your Portfolio Score. Disconnect and reconnect using the same username; verify the score is identical (deterministic).
5.  **Verify Video Interview Loop**:
    *   If you are interviewing, click **Start Your AI Video Interview** in the portal.
    *   Verify the page has no candidate selector dropdown and is locked onto your name.
    *   Initialize the interview, trigger the mock recorder, observe the stable telemetry tracking, and click through to submit the final score.
