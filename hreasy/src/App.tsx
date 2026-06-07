import React, { useState, useEffect } from 'react';
import { HRProvider, useHR } from './context/HRContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Page imports
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Teams } from './pages/Teams';
import { TeamUpdates } from './pages/TeamUpdates';
import { Recruitment } from './pages/Recruitment';
import { Interview } from './pages/student/Interview';
import { InterviewReport } from './pages/hr/InterviewReport';
import { ATSRankings } from './pages/hr/ATSRankings';
import { LeaveManagement } from './pages/LeaveManagement';
import { Complaints } from './pages/Complaints';
import { Payroll } from './pages/Payroll';
import { Analytics } from './pages/Analytics';
import { UserOnboarding } from './pages/UserOnboarding';
import { Profile } from './pages/Profile';
import { Onboarding } from './pages/Onboarding';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import VideoInterview from './pages/VideoInterview';

import { ShieldAlert } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, activeRole } = useHR();
  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    return hash || 'dashboard';
  });

  // URL Hash Navigation Sync
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      setActivePage(hash || 'dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handlePageChange = (page: string) => {
    window.location.hash = `#/${page}`;
  };

  // Page authorization configurations
  const pagePermissions: Record<string, string[]> = {
    dashboard: ['Admin', 'HR', 'Team Lead', 'Employee'],
    employees: ['Admin', 'HR', 'Team Lead'],
    teams: ['Admin', 'HR', 'Team Lead'],
    updates: ['HR', 'Team Lead', 'Employee'],
    recruitment: ['HR', 'Candidate'],
    ats_rankings: ['HR'],
    interview: ['HR', 'Candidate'],
    'video-interview': ['Candidate'],
    leaves: ['HR', 'Team Lead', 'Employee'],
    complaints: ['HR', 'Team Lead', 'Employee'],
    payroll: ['Admin', 'HR'],
    analytics: ['Admin', 'HR'],
    'user-onboarding': ['Candidate', 'Admin', 'HR', 'Team Lead', 'Employee'],
    profile: ['Candidate', 'Admin', 'HR', 'Team Lead', 'Employee'],
    onboarding: ['Admin', 'HR', 'Employee'],
    settings: ['Admin', 'HR']
  };

  // Redirect to role default pages if active page is restricted
  useEffect(() => {
    if (!currentUser) return;
    const allowedRoles = pagePermissions[activePage];
    const isLoginOrInvalid = activePage === 'login' || !allowedRoles;
    if (isLoginOrInvalid || (allowedRoles && !allowedRoles.includes(activeRole))) {
      // Find a default allowed page for this role
      if (activeRole === 'Candidate') {
        window.location.hash = '#/recruitment';
      } else {
        window.location.hash = '#/dashboard';
      }
    }
  }, [activeRole, activePage, currentUser]);

  // Render core pages
  const renderPage = () => {
    // Check if authorized
    const allowedRoles = pagePermissions[activePage];
    if (allowedRoles && !allowedRoles.includes(activeRole)) {
      return (
        <div className="premium-card p-12 text-center max-w-lg mx-auto space-y-4 my-12 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-palette-1 dark:text-white text-xl">Access Restricted</h3>
          <p className="text-xs text-palette-2 dark:text-slate-400 leading-relaxed">
            Your current role profile (<strong>{activeRole}</strong>) does not have authorization to view this panel.
          </p>
        </div>
      );
    }

    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={handlePageChange} />;
      case 'employees':
        return <Employees />;
      case 'teams':
        return <Teams />;
      case 'updates':
        return <TeamUpdates />;
      case 'recruitment':
        return <Recruitment />;
      case 'ats_rankings':
        return <ATSRankings />;
      case 'interview':
        return activeRole === 'Candidate' ? <Interview /> : <InterviewReport />;
      case 'video-interview':
        return <VideoInterview setActivePage={handlePageChange} />;
      case 'leaves':
        return <LeaveManagement />;
      case 'complaints':
        return <Complaints />;
      case 'payroll':
        return <Payroll />;
      case 'analytics':
        return <Analytics />;
      case 'user-onboarding':
        return <UserOnboarding />;
      case 'profile':
        return <Profile />;
      case 'onboarding':
        return <Onboarding />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActivePage={handlePageChange} />;
    }
  };

  // If not logged in, render the login gateway
  if (!currentUser) {
    return <Login />;
  }

  // Force onboarding if incomplete
  if (currentUser.onboarding_complete === false && activePage !== 'user-onboarding') {
    window.location.hash = '#/user-onboarding';
    return null; // will rerender due to hashchange
  }

  // Hide sidebar/header for Video Interview
  if (activePage === 'video-interview') {
    return (
      <div className="min-h-screen bg-slate-950">
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-palette-3 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar Layout */}
      <Sidebar activePage={activePage} setActivePage={handlePageChange} />

      {/* Main Content Pane */}
      <div className="pl-64 min-h-screen flex flex-col">
        {/* Header Layout */}
        <Header activePage={activePage} />

        {/* Content Pane */}
        <main className="flex-1 p-8 mt-20 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <HRProvider>
      <AppContent />
    </HRProvider>
  );
}

export default App;
