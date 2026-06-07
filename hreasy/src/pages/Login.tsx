import React, { useState } from 'react';
import { useHR, type UserRole } from '../context/HRContext';
import { Shield, Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const Login: React.FC = () => {
  const { login, register, googleLogin } = useHR();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('hr@enterprise.com');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<UserRole>('HR');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) {
      setErrorMsg('Please fill in all credentials.');
      return;
    }
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    if (success) {
      if (email.toLowerCase().startsWith('candidate')) {
        window.location.hash = '#/recruitment';
      } else {
        window.location.hash = '#/dashboard';
      }
    } else {
      setErrorMsg('Invalid email or password combination.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    const success = await register(email, password, role);
    setIsSubmitting(false);
    if (success) {
      setSuccessMsg(`Account registered successfully as ${role}! Please sign in.`);
      setActiveTab('signin');
      setEmail('');
      setPassword('');
    } else {
      setErrorMsg('This email address is already registered.');
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleRealGoogleLogin = async () => {
    setGoogleError('');
    try {
      // 1. Trigger the actual Google Popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 2. Get the secure Firebase ID token
      const idToken = await user.getIdToken();
      
      // 3. Send it to our backend
      setIsSubmitting(true);
      const success = await googleLogin(idToken);
      setIsSubmitting(false);

      if (success) {
        window.location.hash = '#/recruitment';
      } else {
        setGoogleError('Login failed. Please make sure you are not using an HR account.');
      }
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      setIsSubmitting(false);
      setGoogleError('Google Sign-In was cancelled or failed.');
    }
  };

  return (
    <div className="min-h-screen bg-palette-3 dark:bg-slate-950 flex flex-col md:flex-row justify-center items-center p-6 gap-8 relative overflow-hidden transition-colors duration-300">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-palette-4/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-palette-5/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand & Product Value Card */}
      <div className="w-full max-w-md space-y-6 text-center md:text-left z-10 animate-in slide-in-from-left-6 duration-500">
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <div className="bg-palette-1 dark:bg-palette-4 p-3 rounded-2xl text-white shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-extrabold text-3xl tracking-wider text-palette-1 dark:text-white bg-gradient-to-r from-palette-1 dark:from-white to-palette-4 dark:to-palette-2 bg-clip-text text-transparent">
              NexHire
            </h1>
            <span className="text-sm text-palette-4 dark:text-palette-2 font-bold uppercase tracking-wider">Enterprise HR Suite</span>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-extrabold text-palette-1 dark:text-slate-100 leading-snug">
          Integrated intelligence to streamline talent acquisition, reviews, and operations.
        </h2>

        <div className="space-y-3 hidden md:block text-xs font-semibold text-palette-1/70 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-palette-5" />
            <span>AI ATS parsing & standardized candidate scores</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-palette-5" />
            <span>Autonomous leave recommendations & anomalies flags</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-palette-5" />
            <span>Speech, sentiment, and telemetry scan metrics HUD</span>
          </div>
        </div>
      </div>

      {/* Sign-In / Sign-Up Form Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-palette-2/20 dark:border-slate-800 shadow-2xl p-8 z-10 animate-in slide-in-from-right-6 duration-500 transition-colors duration-300">
        
        {/* Toggle tabs */}
        <div className="flex bg-palette-3 dark:bg-slate-800 p-1.5 rounded-2xl mb-6 border border-palette-2/15 dark:border-slate-700/50">
          <button
            onClick={() => { setActiveTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-slate-900 text-palette-1 dark:text-white shadow-md'
                : 'text-palette-2 dark:text-slate-400 hover:text-palette-1'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-slate-900 text-palette-1 dark:text-white shadow-md'
                : 'text-palette-2 dark:text-slate-400 hover:text-palette-1'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold px-4 py-3 rounded-xl mb-4 animate-in fade-in duration-200">
            {errorMsg}
          </div>
        )}
        {googleError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold px-4 py-3 rounded-xl mb-4 animate-in fade-in duration-200">
            {googleError}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold px-4 py-3 rounded-xl mb-4 animate-in fade-in duration-200">
            {successMsg}
          </div>
        )}

        {/* Render sign in */}
        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-2">Select Your Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => {
                    const selectedRole = e.target.value as UserRole;
                    setRole(selectedRole);
                    const emailMap: Record<UserRole, string> = {
                      'HR': 'hr@enterprise.com',
                      'Team Lead': 'lead@enterprise.com',
                      'Employee': 'employee@enterprise.com',
                      'Candidate': 'candidate@enterprise.com'
                    };
                    setEmail(emailMap[selectedRole]);
                    setPassword('password');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-palette-3/50 dark:bg-slate-800 border border-palette-2/30 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-4 dark:focus:ring-palette-2 focus:bg-white text-palette-1 dark:text-white transition-all font-semibold"
                >
                  <option value="HR">HR Manager</option>
                  <option value="Admin">System Admin</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Employee">Regular Employee</option>
                  <option value="Candidate">Job Candidate</option>
                </select>
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-palette-2 dark:text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-2">Corporate Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-palette-3/50 dark:bg-slate-800 border border-palette-2/30 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-4 dark:focus:ring-palette-2 focus:bg-white text-palette-1 dark:text-white transition-all font-semibold"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-palette-2 dark:text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-palette-3/50 dark:bg-slate-800 border border-palette-2/30 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-4 dark:focus:ring-palette-2 focus:bg-white text-palette-1 dark:text-white transition-all font-semibold"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-palette-2 dark:text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-palette-4 hover:bg-palette-1 dark:hover:bg-palette-2 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In to Suite'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="relative my-4 text-center">
              <hr className="border-palette-2/15 dark:border-slate-800" />
              <span className="bg-white dark:bg-slate-900 px-2 text-[9px] font-bold text-palette-2 dark:text-slate-500 uppercase absolute top-[-6px] left-1/2 -translate-x-1/2 transition-colors duration-300">
                Or Candidates Only
              </span>
            </div>

            <button
              type="button"
              onClick={handleRealGoogleLogin}
              disabled={isSubmitting}
              className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-palette-2/30 dark:border-slate-700 text-palette-1 dark:text-slate-100 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.15C3.18 21.88 7.39 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.38-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.06-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 6.51l4.06 3.15c.95-2.85 3.6-4.91 6.73-4.91z"
                />
              </svg>
              Sign In with Google
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-palette-3/50 dark:bg-slate-800 border border-palette-2/30 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-4 dark:focus:ring-palette-2 focus:bg-white text-palette-1 dark:text-white transition-all font-semibold"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-palette-2 dark:text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-palette-3/50 dark:bg-slate-800 border border-palette-2/30 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-4 dark:focus:ring-palette-2 focus:bg-white text-palette-1 dark:text-white transition-all font-semibold"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-palette-2 dark:text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-2">Assigned Suite Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-palette-3/50 dark:bg-slate-800 border border-palette-2/30 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-4 dark:focus:ring-palette-2 focus:bg-white text-palette-1 dark:text-white transition-all font-semibold"
                >
                  <option value="HR">HR Manager</option>
                  <option value="Admin">System Admin</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Employee">Regular Employee</option>
                  <option value="Candidate">Job Candidate</option>
                </select>
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-palette-2 dark:text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-palette-5 hover:bg-palette-1 dark:hover:bg-palette-2 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-1.5"
            >
              Create Credentials
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}





      </div>
    </div>
  );
};
