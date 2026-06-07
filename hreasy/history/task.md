# Tasks: AI-Powered HR Management Suite - Phase 2

## Routing & History
- [x] Implement lightweight URL hash-based routing in `App.tsx`
- [x] Listen to `hashchange` events in `App.tsx` to handle browser back/forward buttons
- [x] Sync all page navigation updates (sidebar, dashboard clicks) to update the URL hash

## User Authentication (Sign In & Sign Up)
- [x] Add `currentUser` and `registeredUsers` state & persistence in `HRContext.tsx`
- [x] Add `login`, `register`, and `logout` logic in `HRContext.tsx`
- [x] Create Sign In / Sign Up gateway interface: [Login.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/pages/Login.tsx)
- [x] Render [Login.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/pages/Login.tsx) as the gateway before loading core dashboards
- [x] Add a visual "Quick Login Demo Panel" for 1-click test access as HR, Lead, Employee, or Candidate

## Onboarding Registry Update
- [x] Update [Onboarding.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/pages/Onboarding.tsx) with a "Onboard New Hire" form (Name, Email, Role, Department, Join Date)
- [x] Sync onboarding creation to add new employees to `HRContext` and trigger immediate AI checklists

## Profile Menu & Theme Toggles
- [x] Add `themeMode` ('light' | 'dark') and `toggleTheme` to `HRContext.tsx`
- [x] Set up theme-changing styling classes in root index stylesheet and `App.tsx`
- [x] Update [Header.tsx](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/ai-hr-suite/src/components/Header.tsx) to render a dropdown on clicking the user profile icon
- [x] Implement Light/Dark mode selector inside profile dropdown menu
- [x] Implement logout trigger inside profile dropdown and sidebar footer

## Build & Test Verification
- [x] Run typescript compiler and Vite build check to verify 100% compilation
- [x] Launch browser subagent verification to test back navigation, dark/light mode toggle, registration, and new employee onboarding
- [x] Create walkthrough reporting artifacts
