import React from 'react';
import { useHR } from '../context/HRContext';
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  ClipboardList, 
  Briefcase, 
  Video, 
  Award,
  Calendar, 
  AlertTriangle, 
  DollarSign, 
  BarChart3, 
  UserPlus, 
  Settings,
  Shield,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { activeRole, currentUser, logout } = useHR();

  // Define navigation items with roles allowed to view them
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'HR', 'Team Lead', 'Employee'] },
    { id: 'employees', name: 'Employees', icon: Users, roles: ['Admin', 'HR', 'Team Lead'] },
    { id: 'teams', name: 'Teams', icon: Network, roles: ['Admin', 'HR', 'Team Lead'] },
    { id: 'updates', name: 'Team Updates', icon: ClipboardList, roles: ['HR', 'Team Lead', 'Employee'] },
    { id: 'recruitment', name: 'Recruitment (ATS)', icon: Briefcase, roles: ['HR', 'Candidate'] },
    { id: 'ats_rankings', name: 'ATS Rankings', icon: Award, roles: ['HR'] },
    { id: 'interview', name: 'AI Video Interview', icon: Video, roles: ['HR', 'Candidate'] },
    { id: 'leaves', name: 'Leave Management', icon: Calendar, roles: ['HR', 'Team Lead', 'Employee'] },
    { id: 'complaints', name: 'Complaints Hub', icon: AlertTriangle, roles: ['HR', 'Team Lead', 'Employee'] },
    { id: 'payroll', name: 'Payroll & Compensation', icon: DollarSign, roles: ['Admin', 'HR'] },
    { id: 'analytics', name: 'Business Analytics', icon: BarChart3, roles: ['Admin', 'HR'] },
    { id: 'onboarding', name: 'Onboarding Portal', icon: UserPlus, roles: ['HR', 'Employee'] }, // HR and Onboarding Employee
    { id: 'settings', name: 'System Settings', icon: Settings, roles: ['Admin', 'HR'] },
  ];

  // Filter items based on active role
  const visibleItems = navItems.filter(item => {
    // Custom logic for onboarding to include Employee for demo purposes
    if (item.id === 'onboarding') {
      return activeRole === 'HR' || activeRole === 'Admin' || activeRole === 'Employee';
    }
    return item.roles.includes(activeRole);
  });

  return (
    <aside className="w-64 bg-palette-1 text-white flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl border-r border-palette-2/10">
      {/* Brand Header */}
      <div className="p-6 border-b border-palette-2/10 flex items-center gap-3">
        <div className="bg-palette-5 p-2 rounded-xl text-white shadow-md">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white to-palette-2 bg-clip-text text-transparent">
            NexHire
          </h1>
          <span className="text-xs text-palette-2 font-medium">Smart HRM Suite</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-palette-4 text-white shadow-md glow-primary font-semibold'
                  : 'text-palette-2 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${
                isActive ? 'scale-110 text-white' : 'text-palette-2 group-hover:scale-110 group-hover:text-white'
              }`} />
              <span>{item.name}</span>
              {item.id === 'interview' && activeRole === 'HR' && (
                <span className="ml-auto bg-palette-5 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  AI Live
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer User Info Summary & Sign Out */}
      <div className="p-4 border-t border-palette-2/10 bg-black/10 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-palette-4 border border-palette-2/20 overflow-hidden flex items-center justify-center font-bold text-lg text-white shrink-0">
            {activeRole.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-palette-2 font-semibold truncate">{currentUser?.email || 'Guest User'}</p>
            <p className="text-xs font-bold text-white truncate">{activeRole} Portal</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-palette-2 hover:text-white text-xs font-semibold py-2 rounded-xl transition-all border border-white/5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
