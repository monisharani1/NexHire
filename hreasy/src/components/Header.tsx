import React, { useState, useRef } from 'react';
import { useHR } from '../context/HRContext';
import { SearchBar } from './SearchBar';
import { Bell, Search, AlertCircle, Sparkles, User, Sun, Moon, LogOut, Settings } from 'lucide-react';

interface HeaderProps {
  activePage: string;
}

export const Header: React.FC<HeaderProps> = ({ activePage }) => {
  const { 
    activeRole, 
    leaves, 
    complaints, 
    payroll, 
    candidates, 
    currentUser, 
    themeMode, 
    toggleTheme, 
    logout 
  } = useHR();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate dynamic, AI-centric notifications based on current DB state
  const getNotifications = () => {
    const list: { id: string; title: string; desc: string; type: string; time: string }[] = [];
    
    // Check for high risk leaves
    const cautionLeaves = leaves.filter(l => l.status === 'pending' && l.aiRecommendation.action === 'caution');
    cautionLeaves.forEach(l => {
      list.push({
        id: `notif-leave-${l.id}`,
        title: 'Conflict Detected (AI Recommendation)',
        desc: `Alice Smith requested leave, but it overlaps with a core release.`,
        type: 'warning',
        time: 'Just now'
      });
    });

    // Check for high priority complaints
    const highComplaints = complaints.filter(c => c.status === 'pending' && c.priority === 'high');
    highComplaints.forEach(c => {
      list.push({
        id: `notif-comp-${c.id}`,
        title: 'Burnout Alert (AI Sentiment)',
        desc: `High-priority stress/workload complaint raised by employee.`,
        type: 'danger',
        time: '10m ago'
      });
    });

    // Check for payroll anomalies
    const anomalies = payroll.flatMap(p => p.anomalies.map((a, idx) => ({ id: p.id, text: a, idx })));
    anomalies.forEach(a => {
      list.push({
        id: `notif-pay-${a.id}-${a.idx}`,
        title: 'Payroll Anomaly Flagged',
        desc: a.text,
        type: 'info',
        time: '1h ago'
      });
    });

    // Check for new candidates with high ATS
    const topCandidates = candidates.filter(c => c.stage === 'screening' && c.atsScore >= 85);
    topCandidates.forEach(c => {
      list.push({
        id: `notif-cand-${c.id}`,
        title: 'High ATS Match (AI Recruitment)',
        desc: `${c.name} matches ${c.atsScore}% of Senior Frontend requirements.`,
        type: 'success',
        time: '2h ago'
      });
    });

    return list.slice(0, 5); // Return top 5
  };

  const notifications = getNotifications();

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'HR Dashboard & Insights';
      case 'employees': return 'Employee Directory';
      case 'teams': return 'Teams & Productivity';
      case 'updates': return 'Work Updates Timeline';
      case 'recruitment': return 'AI Recruitment & ATS Scanner';
      case 'interview': return 'AI Video Interview Simulator';
      case 'leaves': return 'Leave approvals & Planning';
      case 'complaints': return 'Employee Complaints Hub';
      case 'payroll': return 'Payroll & Compensation';
      case 'analytics': return 'Workforce Analytics';
      case 'onboarding': return 'Employee Onboarding';
      case 'settings': return 'System Settings';
      default: return 'NexHire Portal';
    }
  };  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-palette-2/20 dark:border-slate-800 fixed top-0 right-0 left-64 z-20 px-8 flex items-center justify-between shadow-sm transition-colors duration-300">
      {/* Page Title & AI status tag */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-palette-1 dark:text-white">{getPageTitle()}</h2>
        <div className="bg-palette-3 dark:bg-slate-800 text-palette-4 dark:text-palette-2 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-palette-5" />
          <span>AI Engine Active</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-6">

        {/* Search Bar */}
        <div className="hidden lg:block">
          <SearchBar />
        </div>

        {/* Notifications Trigger */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-palette-1/70 dark:text-slate-400 hover:text-palette-4 hover:bg-palette-3/50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 relative cursor-pointer"
          >
            <Bell className="w-5.5 h-5.5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-palette-5 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-palette-2/20 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-palette-2/20 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-sm text-palette-1 dark:text-white flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-palette-5" />
                  AI System Alerts
                </span>
                <span className="text-[10px] bg-palette-5/10 text-palette-5 font-bold px-2 py-0.5 rounded-full">
                  {notifications.length} Alerts
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-palette-2 dark:text-slate-500">
                    No active AI alerts or warnings.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-3.5 border-b border-palette-2/10 dark:border-slate-800/60 hover:bg-palette-3/30 dark:hover:bg-slate-800/40 transition-colors flex gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        notif.type === 'danger' ? 'bg-red-500' :
                        notif.type === 'warning' ? 'bg-orange-500' :
                        notif.type === 'success' ? 'bg-green-500' : 'bg-palette-4'
                      }`} />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-palette-1 dark:text-slate-200">{notif.title}</p>
                        <p className="text-[11px] text-palette-1/70 dark:text-slate-400 leading-relaxed mt-0.5">{notif.desc}</p>
                        <span className="text-[9px] text-palette-2 dark:text-slate-500 font-medium block mt-1">{notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile with dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 pl-2 border-l border-palette-2/30 dark:border-slate-800/80 text-left cursor-pointer group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-palette-4/15 dark:bg-palette-4/10 flex items-center justify-center border border-palette-4/30 dark:border-palette-4/20 group-hover:bg-palette-4/20 transition-all">
              <User className="w-4 h-4 text-palette-4 dark:text-palette-2" />
            </div>
            <div className="hidden xl:block">
              <p className="text-xs font-bold text-palette-1 dark:text-white group-hover:text-palette-4 dark:group-hover:text-palette-2 transition-colors">
                {currentUser?.email.split('@')[0] || 'Jennifer Ross'}
              </p>
              <p className="text-[9px] text-palette-2 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {activeRole}
              </p>
            </div>
          </button>

          {/* Profile Dropdown Options Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-palette-2/20 dark:border-slate-800 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
              <div className="px-4 py-2 border-b border-palette-2/10 dark:border-slate-800/80">
                <p className="text-[9px] font-bold text-palette-2 dark:text-slate-500 uppercase tracking-wider">Logged In As</p>
                <p className="text-xs font-extrabold text-palette-1 dark:text-white truncate mt-0.5">{currentUser?.email || 'hr@enterprise.com'}</p>
                <p className="text-[9.5px] text-palette-5 dark:text-palette-2 font-bold mt-0.5">Base Role: {currentUser?.role}</p>
              </div>

              <div className="p-1.5 space-y-0.5">
                {/* Dark/Light mode toggle */}
                <button
                  onClick={() => { toggleTheme(); setShowProfileMenu(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-palette-1 dark:text-slate-200 hover:bg-palette-3/50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    {themeMode === 'light' ? (
                      <>
                        <Moon className="w-4 h-4 text-indigo-500" />
                        <span>Dark Theme</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>Light Theme</span>
                      </>
                    )}
                  </span>
                  <span className="text-[9px] bg-palette-3 dark:bg-slate-800 px-2 py-0.5 rounded-full font-extrabold uppercase border border-palette-2/15 dark:border-slate-700 text-palette-2 dark:text-slate-400">
                    {themeMode}
                  </span>
                </button>

                {/* Profile Panel link */}
                <button
                  onClick={() => { window.location.hash = '#/profile'; setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-palette-1 dark:text-slate-200 hover:bg-palette-3/50 dark:hover:bg-slate-800 rounded-xl transition-all text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-palette-2" />
                  <span>My Profile</span>
                </button>

                {/* Settings Panel link */}
                {(activeRole === 'HR' || activeRole === 'Admin') && (
                  <button
                    onClick={() => { window.location.hash = '#/settings'; setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-palette-1 dark:text-slate-200 hover:bg-palette-3/50 dark:hover:bg-slate-800 rounded-xl transition-all text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-palette-2" />
                    <span>Settings Dashboard</span>
                  </button>
                )}

                {/* Divider */}
                <div className="border-t border-palette-2/10 dark:border-slate-800/80 my-1" />

                {/* Log Out */}
                <button
                  onClick={() => { logout(); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
