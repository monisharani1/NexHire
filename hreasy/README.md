# 🧠 HREasy — AI-Powered HR Management Suite

> A full-featured, enterprise-grade Human Resources management system with built-in AI assistance for recruitment screening, interview analysis, leave risk assessment, payroll anomaly detection, and attrition forecasting.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![Recharts](https://img.shields.io/badge/Recharts-3.8-FF6384)](https://recharts.org)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Default Login Credentials](#-default-login-credentials)
- [Role-Based Access Control](#-role-based-access-control)
- [Module Breakdown](#-module-breakdown)
- [Data Architecture](#-data-architecture)
- [Backend Integration Guide](#-backend-integration-guide)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)

---

## 🌟 Overview

**HREasy** is a modern, single-page HR dashboard built with **React 19 + TypeScript + Vite**. It simulates a fully operational HR ecosystem for enterprise teams — covering everything from employee lifecycle management and AI-powered recruitment screening to payroll anomaly detection, team monitoring, leave risk analysis, and anonymous grievance handling.

The application currently runs **entirely on the frontend** using `localStorage` as a persistence layer. All "AI" behaviours are simulated within the `HRContext` state engine. This architecture makes it trivially easy to wire up a real REST or GraphQL backend — every data operation is already abstracted into clean context functions.

---

## ✨ Features

| Module | Key Capabilities |
|---|---|
| 🏠 **Dashboard** | Real-time KPI cards, AI insight alerts, team status, quick actions |
| 👥 **Employees** | Add / edit / suspend / terminate employees, profile management |
| 🏢 **Teams** | Create teams, assign leads & members, track sprint progress & delay risk |
| 📢 **Team Updates** | Post progress updates with blocker tracking; AI auto-generates risk summaries |
| 🎯 **Recruitment** | Job openings CRUD, candidate applications, AI ATS resume scanner |
| 🎥 **AI Interview** | Live webcam interview portal with real-time telemetry HUD (confidence, eye contact, clarity, technical) |
| 🌴 **Leave Management** | Submit leave requests; AI recommends approval/caution based on team workload |
| 📣 **Complaints** | Anonymous and named grievance submission with sentiment analysis & priority scoring |
| 💰 **Payroll** | Salary matrix, bonus/deduction editing, AI double-payment anomaly detection, digital payslip generator |
| 📊 **Analytics** | Recharts-powered dashboards — attrition forecast, hiring funnel, payroll trend, productivity correlation |
| 🚀 **Onboarding** | Structured onboarding checklist flow for new hires |
| ⚙️ **Settings** | Configurable AI thresholds (ATS score, auto-shortlist), alert emails, feature toggles |
| 🔐 **Auth** | Login / Register with role-based routing; session persisted to `localStorage` |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | TailwindCSS 3.4 with custom design palette |
| Charts | Recharts 3.8 |
| Icons | Lucide React |
| State Management | React Context API (`HRContext`) |
| Persistence (Frontend) | Browser `localStorage` |
| Linting | ESLint 10 + TypeScript-ESLint |

### Design Palette

| Token | Hex | Usage |
|---|---|---|
| `palette-1` | `#1B325F` | Deep Navy — primary text & backgrounds |
| `palette-2` | `#9CC4E4` | Soft Sky Blue — secondary text |
| `palette-3` | `#E9F2F9` | Ice Blue — card & surface backgrounds |
| `palette-4` | `#3A89C9` | Action Blue — buttons & accents |
| `palette-5` | `#F26C4F` | Coral Orange — AI highlights & alerts |

---

## 📁 Project Structure

```
hr-project/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Images, SVGs
│   ├── components/
│   │   ├── Header.tsx       # Top navigation bar (search, notifications, theme toggle, user menu)
│   │   └── Sidebar.tsx      # Left navigation sidebar with role-aware menu items
│   ├── context/
│   │   └── HRContext.tsx    # ⭐ Central state store — all data models, AI logic, CRUD operations
│   ├── pages/
│   │   ├── Dashboard.tsx    # KPI overview + AI insights panel
│   │   ├── Employees.tsx    # Employee directory & management
│   │   ├── Teams.tsx        # Team builder & sprint tracker
│   │   ├── TeamUpdates.tsx  # Progress update timeline with AI risk scoring
│   │   ├── Recruitment.tsx  # Job board + ATS candidate leaderboard
│   │   ├── AIInterview.tsx  # Video interview portal + live telemetry HUD
│   │   ├── LeaveManagement.tsx  # Leave requests + AI workload recommendations
│   │   ├── Complaints.tsx   # Grievance submission + sentiment triage
│   │   ├── Payroll.tsx      # Salary spreadsheet + payslip generator
│   │   ├── Analytics.tsx    # Recharts analytics console
│   │   ├── Onboarding.tsx   # New hire onboarding checklist
│   │   ├── Settings.tsx     # AI configuration & notification settings
│   │   └── Login.tsx        # Auth gateway (login + register)
│   ├── App.tsx              # Root app shell — routing, layout, permission guards
│   ├── main.tsx             # React entry point
│   ├── index.css            # Global base styles
│   └── App.css              # App-level component styles
├── index.html
├── tailwind.config.js       # Custom palette + dark mode config
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 18.x`
- **npm** `>= 9.x` (or pnpm / yarn)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/monisharani1/hreasy.git
cd hreasy

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be running at **http://localhost:5173** by default.

### Build for Production

```bash
npm run build
```

Output is placed in the `dist/` folder. Serve with any static hosting (Vercel, Netlify, GitHub Pages, Nginx, etc.).

### Preview Production Build

```bash
npm run preview
```

---

## 🔑 Default Login Credentials

The app ships with five pre-seeded demo accounts covering all roles:

| Role | Email | Password |
|---|---|---|
| 🔴 **Admin** | `admin@enterprise.com` | `password` |
| 🟡 **HR** | `hr@enterprise.com` | `password` |
| 🔵 **Team Lead** | `lead@enterprise.com` | `password` |
| 🟢 **Employee** | `employee@enterprise.com` | `password` |
| 🟠 **Candidate** | `candidate@enterprise.com` | `password` |

> You can also register new accounts directly from the Login page.

---

## 🛡 Role-Based Access Control

Each page enforces role-based authorization. Unauthorized access is blocked with a "Access Restricted" screen.

| Page | Admin | HR | Team Lead | Employee | Candidate |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |
| Employees | ✅ | ✅ | ✅ | ❌ | ❌ |
| Teams | ✅ | ✅ | ✅ | ❌ | ❌ |
| Team Updates | ❌ | ✅ | ✅ | ✅ | ❌ |
| Recruitment | ❌ | ✅ | ❌ | ❌ | ✅ |
| AI Interview | ❌ | ✅ | ❌ | ❌ | ✅ |
| Leaves | ❌ | ✅ | ✅ | ✅ | ❌ |
| Complaints | ❌ | ✅ | ✅ | ✅ | ❌ |
| Payroll | ✅ | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Onboarding | ✅ | ✅ | ❌ | ✅ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📦 Module Breakdown

### `HRContext.tsx` — The Central Brain

All application state lives here. Every data type is typed with a TypeScript interface and all mutations go through context functions. Key data models:

- `Employee` — id, name, email, department, role, status, performanceRating, joinDate, avatar
- `Team` — id, name, leadId, members[], progress, delayRisk, productivityScore
- `TeamUpdate` — teamId, content, progress, blockers[], riskLevel, aiSummary
- `Complaint` — category, isAnonymous, sentiment, priority, status
- `LeaveRequest` — type, dates, aiRecommendation `{ action, message }`
- `PayrollRecord` — baseSalary, bonus, deductions, anomalies[]
- `Candidate` — atsScore, matchDetails[], stage, interviewScore, videoMetrics
- `JobOpening` — title, department, requirements[], status
- `SystemSettings` — AI thresholds, feature flags, notification email

### AI Simulation Layer

All AI features are simulated deterministically within `HRContext`. To replace with real API calls, simply swap the function body:

| Function | Current Behaviour | Replace With |
|---|---|---|
| `triggerAIScreening()` | Keyword frequency analysis on resume text | Call your ATS / LLM API |
| `submitComplaint()` | Keyword-based sentiment & priority detection | NLP sentiment API |
| `submitLeaveRequest()` | Team workload + lead-role heuristic | Calendar/workload integration |
| `addTeamUpdate()` | Progress % + blocker count risk score | ML pipeline risk model |

---

## 🔌 Backend Integration Guide

The frontend is fully ready to be wired up to a backend. Here is what each section needs:

### Authentication

Currently using localStorage + plain-text password matching. For production:

1. Replace `login()` in `HRContext.tsx` with a `POST /api/auth/login` call.
2. Store a JWT in `localStorage` or an `httpOnly` cookie.
3. Replace `register()` with a `POST /api/auth/register` call.
4. Add an auth interceptor (Axios/fetch wrapper) to attach the `Authorization: Bearer <token>` header on all requests.

```typescript
// Example: Replace this in HRContext.tsx
const login = async (email: string, password: string): Promise<boolean> => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return false;
  const { token, user } = await res.json();
  localStorage.setItem('hr_token', token);
  setCurrentUser({ email: user.email, role: user.role });
  return true;
};
```

### REST API Endpoints to Implement

Below is the full list of CRUD operations currently simulated in the frontend. Each maps directly to a REST route your backend should expose:

#### Employees
| Method | Endpoint | Context Function |
|---|---|---|
| `GET` | `/api/employees` | Initial load in `useState` |
| `POST` | `/api/employees` | `addEmployee()` |
| `PUT` | `/api/employees/:id` | `updateEmployee()` |
| `DELETE` | `/api/employees/:id` | `deleteEmployee()` |

#### Teams
| Method | Endpoint | Context Function |
|---|---|---|
| `GET` | `/api/teams` | Initial load |
| `POST` | `/api/teams` | `addTeam()` |
| `PUT` | `/api/teams/:id` | `updateTeam()` |

#### Team Updates
| Method | Endpoint | Context Function |
|---|---|---|
| `GET` | `/api/team-updates` | Initial load |
| `POST` | `/api/team-updates` | `addTeamUpdate()` |

#### Recruitment
| Method | Endpoint | Context Function |
|---|---|---|
| `GET` | `/api/jobs` | Initial load |
| `POST` | `/api/jobs` | `addJob()` |
| `PUT` | `/api/jobs/:id/status` | `updateJobStatus()` |
| `GET` | `/api/candidates` | Initial load |
| `POST` | `/api/candidates` | `addCandidate()` |
| `PUT` | `/api/candidates/:id/stage` | `updateCandidateStage()` |
| `PUT` | `/api/candidates/:id/interview` | `updateCandidateInterview()` |
| `POST` | `/api/candidates/:id/ats-screen` | `triggerAIScreening()` |

#### Leave Requests
| Method | Endpoint | Context Function |
|---|---|---|
| `GET` | `/api/leaves` | Initial load |
| `POST` | `/api/leaves` | `submitLeaveRequest()` |
| `PUT` | `/api/leaves/:id/status` | `updateLeaveStatus()` |

#### Complaints
| Method | Endpoint | Context Function |
|---|---|---|
| `GET` | `/api/complaints` | Initial load |
| `POST` | `/api/complaints` | `submitComplaint()` |
| `PUT` | `/api/complaints/:id/resolve` | `resolveComplaint()` |

#### Payroll
| Method | Endpoint | Context Function |
|---|---|---|
| `GET` | `/api/payroll` | Initial load |
| `PUT` | `/api/payroll/:id` | `updatePayroll()` |
| `POST` | `/api/payroll/process-all` | `processAllPayroll()` |

#### Settings
| Method | Endpoint | Context Function |
|---|---|---|
| `GET` | `/api/settings` | Initial load |
| `PUT` | `/api/settings` | `updateSettings()` |

### Replacing `localStorage` with API Calls

The pattern to follow is straightforward. In `HRContext.tsx`, each entity follows this shape:

```typescript
// CURRENT (localStorage):
const [employees, setEmployees] = useState<Employee[]>(() =>
  getInitialState<Employee[]>('hr_employees', MOCK_DATA)
);

// REPLACE WITH (API fetch on mount):
const [employees, setEmployees] = useState<Employee[]>([]);
useEffect(() => {
  fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(setEmployees);
}, []);

// And for mutations:
const addEmployee = async (data: ...) => {
  const res = await fetch('/api/employees', { method: 'POST', body: JSON.stringify(data), ... });
  const newEmployee = await res.json();
  setEmployees(prev => [...prev, newEmployee]);
};
```

### Suggested Backend Stack

HREasy is backend-agnostic. Recommended options:

| Option | Notes |
|---|---|
| **Node.js + Express + PostgreSQL** | Best fit; mirrors the JS/TS ecosystem |
| **Node.js + Fastify + MongoDB** | Good for flexible document schemas |
| **Django REST Framework** | If your team prefers Python |
| **Supabase** | Fastest path to production — instant REST + Auth |
| **Firebase Firestore** | Real-time sync; great for team update feeds |

---

## 🌍 Environment Variables

Create a `.env` file in the project root for backend configuration:

```env
# Base URL for your backend API
VITE_API_BASE_URL=http://localhost:8000/api

# Optional: Auth token storage key
VITE_AUTH_TOKEN_KEY=hr_token
```

Access in code via `import.meta.env.VITE_API_BASE_URL`.

---

## 🎨 Theming

The app supports **Light / Dark mode** via Tailwind's `darkMode: 'class'` strategy. Toggle is available in the header. The theme is stored in `localStorage` as `hr_theme_mode`.

To extend or customize the palette, edit [`tailwind.config.js`](tailwind.config.js):

```js
theme: {
  extend: {
    colors: {
      "palette-1": "#1B325F",  // Deep Navy
      "palette-2": "#9CC4E4",  // Soft Sky Blue
      "palette-3": "#E9F2F9",  // Ice Blue Background
      "palette-4": "#3A89C9",  // Action Blue
      "palette-5": "#F26C4F",  // Coral Orange
    },
  },
},
```

---

## 🧪 Linting

```bash
npm run lint
```

ESLint is configured with:
- `@eslint/js` recommended
- `typescript-eslint` strict rules
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style. All PRs should pass `npm run lint` without errors.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ using React + TypeScript + Vite</sub>
</div>
