# NexHire — Frontend Design

> ⚠️ This file is a placeholder scaffold.
> Update the design details once backend is complete.
> Replace color palette, component names, and layout notes as needed.

---

## Stack

- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (utility-first styling)
- React Router v6 (routing)
- React Query (server state, caching)
- Axios (HTTP client)
- Recharts (charts/graphs)
- Lucide React (icons)

---

## Color Palette (to be updated)

```
Primary:     #2563EB  (blue-600)
Secondary:   #7C3AED  (violet-600)
Accent:      #F59E0B  (amber-500)
Success:     #10B981  (emerald-500)
Danger:      #EF4444  (red-500)
Warning:     #F59E0B  (amber-500)
Background:  #F9FAFB  (gray-50)
Surface:     #FFFFFF
Text:        #111827  (gray-900)
Muted:       #6B7280  (gray-500)
Border:      #E5E7EB  (gray-200)
```

---

## Typography

```
Font family:  Inter (Google Fonts)
Heading:      font-bold, tracking-tight
Body:         font-normal, leading-relaxed
Mono:         font-mono (code blocks)
```

---

## Pages & Routes

### Public (no auth required)
```
/               → Landing page
/login          → Login page
/register       → Register page
/forgot         → Forgot password
/reset          → Reset password
```

### Student Routes (role: student)
```
/dashboard              → Student dashboard
/profile                → Edit profile
/portfolio              → Social portfolio view
/portfolio/connect      → Connect social platforms
/jobs                   → Browse jobs
/jobs/:id               → Job detail + apply
/applications           → My applications
/applications/:id       → Application detail + chat
/resume                 → Upload + screen resume
```

### HR Routes (role: recruiter / manager)
```
/hr/dashboard           → HR dashboard
/hr/candidates          → All candidates list
/hr/candidates/:id      → Candidate detail
/hr/jobs                → Manage jobs
/hr/jobs/new            → Create job
/hr/jobs/:id            → Job applications
/hr/employees           → Employee list
/hr/employees/:id       → Employee detail
/hr/performance         → Performance insights
/hr/payroll             → Payroll recommendations
/hr/reports             → Analytics + reports
```

### Admin Routes (role: admin)
```
/admin/dashboard        → Admin dashboard
/admin/users            → User management
/admin/settings         → System settings
/admin/logs             → Audit logs
```

---

## Component Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ForgotPassword.tsx
│   ├── student/
│   │   ├── Dashboard.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Jobs.tsx
│   │   ├── Applications.tsx
│   │   └── ResumeScreen.tsx
│   ├── hr/
│   │   ├── Dashboard.tsx
│   │   ├── Candidates.tsx
│   │   ├── CandidateDetail.tsx
│   │   ├── Jobs.tsx
│   │   ├── Employees.tsx
│   │   ├── Performance.tsx
│   │   └── Payroll.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       └── Users.tsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── Layout.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Spinner.tsx
│   │   └── SkeletonLoader.tsx
│   ├── charts/
│   │   ├── AttendanceChart.tsx
│   │   ├── PerformanceChart.tsx
│   │   ├── HiringFunnelChart.tsx
│   │   └── LeetCodeDonut.tsx
│   ├── portfolio/
│   │   ├── GitHubCard.tsx
│   │   ├── LeetCodeCard.tsx
│   │   ├── CodeForcesCard.tsx
│   │   └── AchievementBadge.tsx
│   ├── resume/
│   │   ├── ResumeUpload.tsx
│   │   └── ResumeResults.tsx
│   └── chat/
│       ├── ChatBox.tsx
│       ├── MessageBubble.tsx
│       └── SentimentBadge.tsx
│
├── utils/
│   ├── api.ts           ← axios instance + interceptors
│   ├── auth.ts          ← Firebase setup
│   ├── helpers.ts       ← date format, score colors
│   └── constants.ts     ← API_URL, roles, etc.
│
├── hooks/
│   ├── useAuth.ts       ← auth state
│   ├── usePortfolio.ts  ← portfolio data
│   └── useRole.ts       ← role-based rendering
│
├── store/
│   └── authStore.ts     ← user context
│
└── App.tsx              ← routes + providers
```

---

## Dashboard Layouts

### Student Dashboard
```
┌─────────────────────────────────────────────┐
│ TopBar: NexHire logo | User name | Logout   │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Welcome back, [Name] 👋          │
│          │                                  │
│ Dashboard│  ┌──────┐ ┌──────┐ ┌──────┐     │
│ Portfolio│  │Score │ │Jobs  │ │Apps  │     │
│ Jobs     │  │ 742  │ │  12  │ │  3   │     │
│ Resume   │  └──────┘ └──────┘ └──────┘     │
│ Chat     │                                  │
│          │  🔗 Connect your profiles        │
│          │  [GitHub] [LeetCode] [CF]        │
│          │                                  │
│          │  📋 Recent Applications          │
│          │  [Job 1 - Screening]             │
│          │  [Job 2 - Applied]               │
└──────────┴──────────────────────────────────┘
```

### HR Dashboard
```
┌─────────────────────────────────────────────┐
│ TopBar: NexHire HR | [Name] | Logout        │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  HR Dashboard                    │
│          │                                  │
│ Dashboard│  ┌──────┐ ┌──────┐ ┌──────┐     │
│ Candidates  │ 42   │ │Hired │ │Reject│     │
│ Jobs     │  │Total │ │  12  │ │  18  │     │
│ Employees│  └──────┘ └──────┘ └──────┘     │
│ Payroll  │                                  │
│ Reports  │  📊 Hiring Funnel Chart          │
│          │                                  │
│          │  🤖 AI Insights                  │
│          │  [Top candidates today]          │
│          │                                  │
│          │  💰 Payroll Recommendations      │
│          │  [3 pending approvals]           │
└──────────┴──────────────────────────────────┘
```

---

## Key UI Decisions (to update)

```
[ ] Sidebar: collapsible on mobile
[ ] Dark mode: optional (post-MVP)
[ ] Loading states: skeleton screens on all data fetches
[ ] Error states: toast notifications (top-right)
[ ] Empty states: illustrated empty state components
[ ] Mobile: bottom nav bar on mobile (student side)
[ ] Animations: subtle fade-in on page load
[ ] Score display: circular progress ring
[ ] Sentiment: color-coded badges (green/gray/red)
[ ] Resume score: large number with color (green/yellow/red)
```

---

## Environment Variables (Frontend)

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Setup Commands

```bash
npm create vite@latest nexhire-frontend -- --template react-ts
cd nexhire-frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install axios react-router-dom firebase
npm install @tanstack/react-query recharts lucide-react
npm run dev
```

---

> Update this file after backend is complete and design decisions are finalized.
