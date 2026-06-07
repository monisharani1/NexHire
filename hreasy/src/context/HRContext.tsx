import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiLogin, apiRegister, apiLogout, setTokens, clearTokens, getToken,
  apiGetEmployees, apiAddEmployee, apiUpdateEmployee, apiDeleteEmployee,
  apiGetTeams, apiCreateTeam, apiUpdateTeam,
  apiGetTeamUpdates, apiAddTeamUpdate,
  apiGetComplaints, apiSubmitComplaint, apiResolveComplaint,
  apiGetLeaves, apiSubmitLeave, apiUpdateLeaveStatus,
  apiGetPayroll, apiUpdatePayroll, apiProcessAllPayroll,
  apiGetCandidates, apiAddCandidate, apiUpdateCandidateStage, apiUpdateCandidateInterview, apiScreenResume,
  apiGetJobs, apiCreateJob, apiUpdateJob, apiUpdateJobStatus,
  apiGetSettings, apiUpdateSettings,
  apiGoogleLogin, apiConnectSocial, apiGetSocialPortfolio, apiSyncSocial, apiDisconnectSocial,
  apiUpdateProfile, apiGetMe, apiSubmitAudio
} from '../services/api';

// ── Type Definitions (unchanged from original) ─────────────────

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'suspended' | 'terminated';
  performanceRating: number;
  joinDate: string;
  avatar: string;
}

export interface Team {
  id: string;
  name: string;
  leadId: string;
  leadName: string;
  members: string[];
  progress: number;
  delayRisk: 'low' | 'medium' | 'high';
  description: string;
  productivityScore: number;
}

export interface TeamUpdate {
  id: string;
  teamId: string;
  teamName: string;
  date: string;
  content: string;
  progress: number;
  blockers: string[];
  riskLevel: 'low' | 'medium' | 'high';
  aiSummary: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: 'workplace' | 'harassment' | 'workload' | 'benefits' | 'other';
  isAnonymous: boolean;
  submittedBy: string;
  status: 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  date: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'unpaid' | 'parental';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  aiRecommendation: {
    action: 'approve' | 'caution';
    message: string;
  };
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  month: string;
  status: 'pending' | 'processed';
  anomalies: string[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  phone: string;
  atsScore: number;
  matchDetails: string[];
  stage: 'applied' | 'screening' | 'interviewing' | 'offered' | 'rejected';
  resumeName: string;
  interviewScore: number;
  interviewVideoUrl?: string;
  videoMetrics?: {
    technical: number;
    communication: number;
    confidence: number;
    eyeContact: number;
    clarity: number;
  };
  breakdown?: any;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  status: 'open' | 'closed';
  max_applications?: number;
}

export interface SystemSettings {
  aiMinAtsScore: number;
  aiAutoShortlistThreshold: number;
  enableEyeContactTracking: boolean;
  enableSentimentAlerts: boolean;
  notificationEmail: string;
  maxApplicationsPerCandidate: number;
}

export type UserRole = 'HR' | 'Team Lead' | 'Employee' | 'Candidate';

export interface UserSession {
  id?: string | number;
  email: string;
  role: UserRole;
  full_name?: string;
  college?: string;
  phone?: string;
  gender?: string;
  year_of_passing?: string;
}

interface HRContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentUser: UserSession | null;
  themeMode: 'light' | 'dark';
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'joinDate' | 'avatar'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  teams: Team[];
  addTeam: (team: Omit<Team, 'id' | 'delayRisk' | 'productivityScore' | 'leadName'>) => Promise<void>;
  updateTeam: (id: string, team: Partial<Team>) => Promise<void>;
  teamUpdates: TeamUpdate[];
  addTeamUpdate: (teamId: string, content: string, progress: number, blockers: string[]) => Promise<void>;
  complaints: Complaint[];
  submitComplaint: (complaint: Omit<Complaint, 'id' | 'status' | 'sentiment' | 'priority' | 'date'>) => Promise<void>;
  resolveComplaint: (id: string) => Promise<void>;
  leaves: LeaveRequest[];
  submitLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'status' | 'aiRecommendation' | 'employeeName'>) => Promise<void>;
  updateLeaveStatus: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  payroll: PayrollRecord[];
  updatePayroll: (id: string, bonus: number, deductions: number, status: 'pending' | 'processed') => Promise<void>;
  processAllPayroll: () => Promise<void>;
  candidates: Candidate[];
  addCandidate: (candidate: any) => Promise<any>;
  updateCandidateStage: (id: string, stage: Candidate['stage']) => Promise<void>;
  updateCandidateInterview: (id: string, score: number, metrics: Candidate['videoMetrics']) => Promise<void>;
  jobs: JobOpening[];
  addJob: (job: Omit<JobOpening, 'id' | 'status'>) => Promise<void>;
  editJob: (id: string, job: Partial<JobOpening>) => Promise<void>;
  updateJobStatus: (id: string, status: 'open' | 'closed') => Promise<void>;
  settings: SystemSettings;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  triggerAIScreening: (candidateId: string, file?: File, fileContentText?: string) => Promise<void>;
  googleLogin: (firebaseToken: string) => Promise<boolean>;
  socialPortfolio: any;
  submitInterviewAudio: (audioBlob: Blob) => Promise<{ text: string }>;
  speakText: (text: string) => void;
  loadSocialPortfolio: (id: string) => Promise<void>;
  connectSocial: (platform: string, username: string) => Promise<boolean>;
  syncSocial: (platform: string) => Promise<boolean>;
  disconnectSocial: (platform: string) => Promise<boolean>;
  updateProfile: (data: any) => Promise<boolean>;
}

const HRContext = createContext<HRContextType | undefined>(undefined);

// Default settings (shown while loading from API)
const DEFAULT_SETTINGS: SystemSettings = {
  aiMinAtsScore: 70,
  aiAutoShortlistThreshold: 85,
  enableEyeContactTracking: true,
  enableSentimentAlerts: true,
  notificationEmail: 'hr-alerts@enterprise.com',
  maxApplicationsPerCandidate: 1,
};

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── Auth & Theme ───────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('nexhire_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('nexhire_role');
    return (saved as UserRole) || 'Employee';
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('hr_theme_mode') as 'light' | 'dark') || 'light';
  });
  const [isLoading, setIsLoading] = useState(false);

  // ── Data State ─────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamUpdates, setTeamUpdates] = useState<TeamUpdate[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [socialPortfolio, setSocialPortfolio] = useState<any>(null);

  // ── Theme Sync ─────────────────────────────────────────────
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('hr_theme_mode', themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode(prev => prev === 'light' ? 'dark' : 'light');

  // ── Load all data when user logs in ───────────────────────
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        empData, teamData, updateData, complaintData,
        leaveData, payrollData, candidateData, jobData, settingsData
      ] = await Promise.allSettled([
        apiGetEmployees(),
        apiGetTeams(),
        apiGetTeamUpdates(),
        apiGetComplaints(),
        apiGetLeaves(),
        apiGetPayroll(),
        apiGetCandidates(),
        apiGetJobs(),
        apiGetSettings(),
      ]);

      if (empData.status === 'fulfilled') setEmployees(empData.value || []);
      if (teamData.status === 'fulfilled') setTeams(teamData.value || []);
      if (updateData.status === 'fulfilled') setTeamUpdates(updateData.value || []);
      if (complaintData.status === 'fulfilled') setComplaints(complaintData.value || []);
      if (leaveData.status === 'fulfilled') setLeaves(leaveData.value || []);
      if (payrollData.status === 'fulfilled') setPayroll(payrollData.value || []);
      if (candidateData.status === 'fulfilled') setCandidates(candidateData.value || []);
      if (jobData.status === 'fulfilled') setJobs(jobData.value || []);
      if (settingsData.status === 'fulfilled') setSettings(settingsData.value || DEFAULT_SETTINGS);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCurrentUserProfile = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const profile = await apiGetMe();
      const session: UserSession = {
        email: profile.email,
        role: profile.role as UserRole,
        full_name: profile.full_name,
        college: profile.college,
        phone: profile.phone,
        gender: profile.gender,
        year_of_passing: profile.year_of_passing,
      };
      setCurrentUser(session);
      localStorage.setItem('nexhire_session', JSON.stringify(session));
    } catch (e) {
      console.error('Failed to load user profile:', e);
    }
  }, []);

  // Load data on mount if user is already logged in
  useEffect(() => {
    if (currentUser && getToken()) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  // Fetch full user profile details once on mount if token exists
  useEffect(() => {
    if (getToken()) {
      loadCurrentUserProfile();
    }
  }, [loadCurrentUserProfile]);

  // Auto-load Candidate social portfolio if logged in as Candidate
  useEffect(() => {
    if (currentUser && activeRole === 'Candidate' && candidates.length > 0) {
      const selfCand = candidates.find(c => c.email === currentUser.email);
      if (selfCand) {
        loadSocialPortfolio(selfCand.id);
      }
    }
  }, [currentUser, activeRole, candidates]);

  // ── Auth Functions ─────────────────────────────────────────

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiLogin(email, password);
      setTokens(res.access_token, res.refresh_token);
      const session: UserSession = { email, role: res.role as UserRole };
      setCurrentUser(session);
      setActiveRoleState(res.role as UserRole);
      localStorage.setItem('nexhire_session', JSON.stringify(session));
      localStorage.setItem('nexhire_role', res.role);
      await loadCurrentUserProfile();
      return true;
    } catch {
      return false;
    }
  };

  const googleLogin = async (firebaseToken: string): Promise<boolean> => {
    try {
      const res = await apiGoogleLogin(firebaseToken);
      setTokens(res.access_token, res.refresh_token);
      const session: UserSession = { email: "social_login_placeholder", role: res.role as UserRole };
      setCurrentUser(session);
      setActiveRoleState(res.role as UserRole);
      localStorage.setItem('nexhire_session', JSON.stringify(session));
      localStorage.setItem('nexhire_role', res.role);
      await loadCurrentUserProfile();
      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = async (profileData: any): Promise<boolean> => {
    try {
      const updated = await apiUpdateProfile(profileData);
      const session: UserSession = {
        email: updated.email,
        role: updated.role as UserRole,
        full_name: updated.full_name,
        college: updated.college,
        phone: updated.phone,
        gender: updated.gender,
        year_of_passing: updated.year_of_passing,
      };
      setCurrentUser(session);
      localStorage.setItem('nexhire_session', JSON.stringify(session));
      return true;
    } catch (e) {
      console.error('Failed to update profile:', e);
      return false;
    }
  };

  const register = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Use email prefix as name if not provided
      const full_name = email.split('@')[0].replace(/[._]/g, ' ')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      await apiRegister(email, password, full_name, role);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    clearTokens();
    setCurrentUser(null);
    setSocialPortfolio(null);
    localStorage.removeItem('nexhire_session');
    localStorage.removeItem('nexhire_role');
    // Clear data state
    setEmployees([]); setTeams([]); setTeamUpdates([]);
    setComplaints([]); setLeaves([]); setPayroll([]);
    setCandidates([]); setJobs([]);
    window.location.hash = '#/dashboard';
  };

  const loadSocialPortfolio = async (id: string) => {
    try {
      const data = await apiGetSocialPortfolio(id);
      setSocialPortfolio(data);
    } catch (e) {
      console.error('Failed to load social portfolio:', e);
    }
  };

  const connectSocial = async (platform: string, username: string): Promise<boolean> => {
    try {
      await apiConnectSocial(platform, username);
      const selfCand = candidates.find(c => c.email === currentUser?.email);
      if (selfCand) {
        await loadSocialPortfolio(selfCand.id);
      } else if (currentUser) {
        await loadSocialPortfolio(currentUser.email.split('@')[0]);
      }
      return true;
    } catch {
      return false;
    }
  };

  const syncSocial = async (platform: string): Promise<boolean> => {
    try {
      await apiSyncSocial(platform);
      const selfCand = candidates.find(c => c.email === currentUser?.email);
      if (selfCand) {
        await loadSocialPortfolio(selfCand.id);
        const candidateData = await apiGetCandidates();
        setCandidates(candidateData || []);
      }
      return true;
    } catch {
      return false;
    }
  };

  const disconnectSocial = async (platform: string): Promise<boolean> => {
    try {
      await apiDisconnectSocial(platform);
      const selfCand = candidates.find(c => c.email === currentUser?.email);
      if (selfCand) {
        await loadSocialPortfolio(selfCand.id);
        const candidateData = await apiGetCandidates();
        setCandidates(candidateData || []);
      } else {
        setSocialPortfolio(null);
      }
      return true;
    } catch {
      return false;
    }
  };

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem('nexhire_role', role);
  };

  // ── Employee Operations ────────────────────────────────────

  const addEmployee = async (empData: Omit<Employee, 'id' | 'joinDate' | 'avatar'>) => {
    const newEmp = await apiAddEmployee(empData);
    setEmployees(prev => [...prev, newEmp]);
  };

  const updateEmployee = async (id: string, empData: Partial<Employee>) => {
    const updated = await apiUpdateEmployee(id, empData);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
  };

  const deleteEmployee = async (id: string) => {
    await apiDeleteEmployee(id);
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // ── Team Operations ────────────────────────────────────────

  const addTeam = async (teamData: Omit<Team, 'id' | 'delayRisk' | 'productivityScore' | 'leadName'>) => {
    const newTeam = await apiCreateTeam(teamData);
    setTeams(prev => [...prev, newTeam]);
  };

  const updateTeam = async (id: string, teamData: Partial<Team>) => {
    const updated = await apiUpdateTeam(id, teamData);
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const addTeamUpdate = async (teamId: string, content: string, progress: number, blockers: string[]) => {
    const newUpdate = await apiAddTeamUpdate({ teamId, content, progress, blockers });
    setTeamUpdates(prev => [newUpdate, ...prev]);
    // Sync team progress
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, progress, delayRisk: newUpdate.riskLevel } : t
    ));
  };

  // ── Complaint Operations ───────────────────────────────────

  const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'status' | 'sentiment' | 'priority' | 'date'>) => {
    const newComplaint = await apiSubmitComplaint({
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      isAnonymous: complaintData.isAnonymous,
      submittedBy: complaintData.submittedBy,
    });
    setComplaints(prev => [newComplaint, ...prev]);
  };

  const resolveComplaint = async (id: string) => {
    const updated = await apiResolveComplaint(id);
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  // ── Leave Operations ───────────────────────────────────────

  const submitLeaveRequest = async (leaveData: Omit<LeaveRequest, 'id' | 'status' | 'aiRecommendation' | 'employeeName'>) => {
    const newLeave = await apiSubmitLeave({
      employeeId: leaveData.employeeId,
      type: leaveData.type,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      reason: leaveData.reason,
    });
    setLeaves(prev => [newLeave, ...prev]);
  };

  const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected') => {
    const updated = await apiUpdateLeaveStatus(id, status);
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
  };

  // ── Payroll Operations ─────────────────────────────────────

  const updatePayroll = async (id: string, bonus: number, deductions: number, status: 'pending' | 'processed') => {
    const updated = await apiUpdatePayroll(id, { bonus, deductions, status });
    setPayroll(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const processAllPayroll = async () => {
    await apiProcessAllPayroll();
    setPayroll(prev => prev.map(p => ({ ...p, status: 'processed' as const })));
  };

  // ── Candidate Operations ───────────────────────────────────

  const addCandidate = async (candidateData: any) => {
    const newCand = await apiAddCandidate(candidateData);
    setCandidates(prev => [newCand, ...prev]);
    return newCand;
  };

  const updateCandidateStage = async (id: string, stage: Candidate['stage']) => {
    const updated = await apiUpdateCandidateStage(id, stage);
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const updateCandidateInterview = async (id: string, score: number, metrics: Candidate['videoMetrics']) => {
    const updated = await apiUpdateCandidateInterview(id, score, metrics);
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const triggerAIScreening = async (candidateId: string, file?: File, fileContentText?: string) => {
    const updated = await apiScreenResume(candidateId, file, fileContentText);
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, ...updated } : c));
  };

  // ── Job Operations ─────────────────────────────────────────

  const addJob = async (jobData: Omit<JobOpening, 'id' | 'status'>) => {
    const newJob = await apiCreateJob(jobData);
    setJobs(prev => [...prev, newJob]);
  };

  const editJob = async (id: string, jobData: Partial<JobOpening>) => {
    const updated = await apiUpdateJob(id, jobData);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updated } : j));
  };

  const updateJobStatus = async (id: string, status: 'open' | 'closed') => {
    const updated = await apiUpdateJobStatus(id, status);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updated } : j));
  };

  // ── Settings ───────────────────────────────────────────────

  const updateSettings = async (updatedSettings: Partial<SystemSettings>) => {
    const updated = await apiUpdateSettings(updatedSettings);
    setSettings(updated);
  };

  // === Video Interview Helpers ===
  const submitInterviewAudio = async (audioBlob: Blob) => {
    try {
      const res = await apiSubmitAudio(audioBlob);
      return res; // { text: "transcribed text" }
    } catch (error) {
      console.error('Failed to submit audio:', error);
      throw error;
    }
  };

  const cachedVoiceRef = React.useRef<SpeechSynthesisVoice | null>(null);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any currently playing audio
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good English voice
    if (!cachedVoiceRef.current) {
      const voices = window.speechSynthesis.getVoices();
      cachedVoiceRef.current = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Natural')) 
                            || voices.find(v => v.lang.startsWith('en')) || null;
    }
    
    if (cachedVoiceRef.current) {
      utterance.voice = cachedVoiceRef.current;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <HRContext.Provider value={{
      activeRole,
      setActiveRole,
      currentUser,
      themeMode,
      isLoading,
      login,
      register,
      logout,
      toggleTheme,
      employees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      teams,
      addTeam,
      updateTeam,
      teamUpdates,
      addTeamUpdate,
      complaints,
      submitComplaint,
      resolveComplaint,
      leaves,
      submitLeaveRequest,
      updateLeaveStatus,
      payroll,
      updatePayroll,
      processAllPayroll,
      candidates,
      addCandidate,
      updateCandidateStage,
      updateCandidateInterview,
      jobs,
      addJob,
      editJob,
      updateJobStatus,
      settings,
      updateSettings,
      triggerAIScreening,
      googleLogin,
      socialPortfolio,
      loadSocialPortfolio,
      connectSocial,
      syncSocial,
      disconnectSocial,
      updateProfile,
      submitInterviewAudio,
      speakText,
    }}>
      {children}
    </HRContext.Provider>
  );
};

export const useHR = () => {
  const context = useContext(HRContext);
  if (context === undefined) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
};
