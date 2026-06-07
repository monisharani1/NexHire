# Implementation Plan - Navigation History & Authentication Portal

We will enhance the AI-Powered HR Management Suite by introducing native browser back-button navigation support, updating the Onboarding employee registry, and implementing a premium Sign In / Sign Up portal to enforce strict role-based access.

---

## Proposed Changes

### 1. Navigation & Routing History

We will implement a lightweight URL hash router inside [App.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/App.tsx) and sync it across the sidebar and sub-panels.
- **Hash Synchronization**: When a user navigates to a tab (e.g., Dashboard or Leave Management), we update `window.location.hash` to `#/dashboard` or `#/leaves`.
- **Browser History Integration**: By listening to `hashchange` events, clicking the browser's back/forward buttons will automatically load the previous/next view in the user's history stack.

### 2. Onboarding Portal Update

In [Onboarding.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/pages/Onboarding.tsx), we will replace/expand the dropdown selection with an employee creation registry:
- **"Onboard New Hire" Mode**: An input form allowing the HR manager to enter a new employee's name, email, department, role, and starting date.
- **Dynamic Insertion**: Submitting the form adds the candidate to the global `employees` database and instantly generates their customized AI onboarding checklist, rather than selecting from pre-existing employees.

### 3. Authentication & Sign In / Sign Up Gateway

We will create a login gateway that serves as the root index page before loading the main suite layout.
- **Role Isolation**: When registering a new email, the user specifies their role (`HR`, `Team Lead`, `Employee`, `Candidate`). The email is permanently tied to that role in `localStorage` database.
- **Security Checkpoints**: Users logging in as a regular `Employee` will only have access to their employee portals (Dashboard, Complaints, Leaves) and cannot access HR panels.
- **Simulation Mode / Role Preview**: For demo purposes, we will display a **Sign Out** button in the sidebar footer to let users swap roles by signing out. We will lock the Header's **Role Switcher** widget so it is only visible when logged in as `Admin` or `HR` (acting as a "Preview employee views" utility for managers).
- **Interactive Quick-Login Widget**: The login page will offer 1-click credentials to log in as pre-registered demo roles (HR, Team Lead, Employee, Candidate).

### 4. Interactive Profile Dropdown & Theme Settings
- **Profile Dropdown Menu**: Clicking the profile icon in the top-right of the header will open a floating menu.
- **Theme Switcher**: Options for toggling **Dark Mode** and **Light Mode** will be built-in. Changing the mode will toggle a `.dark` class on the `<html>` or `<body>` tag, loading a premium dark theme styling system.
- **Session Actions**: The dropdown will show the current user's profile details, quick links (e.g., Settings, Profile), and a **Log Out** button.

---

## Component Updates

### [NEW] [Login.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/pages/Login.tsx)
Create a gorgeous portal featuring glassmorphic forms, card sliders for Sign In / Sign Up tabs, and quick-access demo login badges.

### [MODIFY] [HRContext.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/context/HRContext.tsx)
Extend context to support:
- `currentUser` state tracking `{ email, role }` or `null`.
- `registeredUsers` credentials storage.
- `login`, `register`, and `logout` callbacks.
- Default pre-configured mock credentials.
- `themeMode` ('light' | 'dark') state and `toggleTheme` function.

### [MODIFY] [App.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/App.tsx)
- Redirect unauthenticated users to the Login view.
- Handle state updates through `hashchange` event listeners.
- Add class styling support for dark mode.

### [MODIFY] [Sidebar.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/components/Sidebar.tsx)
- Render active menu links mapped against `currentUser` permissions.
- Integrate a **Sign Out** action in the sidebar footer.

### [MODIFY] [Header.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/components/Header.tsx)
- Render the current user's actual email details.
- Hide or restrict the Role Switcher depending on the user's base account permissions.
- **Profile Menu**: Clicking the profile triggers a dropdown featuring:
  - Account info summary (email & role description).
  - **Light/Dark theme selector** (communicates with `toggleTheme` in context).
  - Quick links (Settings, Profile).
  - Log Out action.

---

## Verification Plan

### Automated/Tool Verification
- Verify that `npm run build` compiles without any linter warning or type failures.
- Spin up `npm run dev` and navigate using the browser subagent.

### Manual Verification
1. **Routing History**: Click around sidebar items, press the browser back button, and verify that the page transitions back correctly.
2. **Registration Enforcement**: Sign up with `test-employee@company.com` as an `Employee`. Try to directly navigate to `#/payroll` or `#/settings` and check that the suite denies permission.
3. **Onboarding Form**: Add a new employee named "John Doe" in the onboarding page. Submit and verify that "John Doe" is registered in the main employee directory and has a compiled checklist.
4. **Profile Menu & Theme Switch**: Click on the profile icon, change theme to dark mode, and verify that the app theme transitions dynamically to dark styles. Click log out and ensure the user is taken back to the login screen.
