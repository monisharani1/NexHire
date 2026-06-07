import React, { useState, useEffect } from 'react';
import { useHR } from '../context/HRContext';
import { 
  Briefcase, 
  UploadCloud, 
  Sparkles, 
  X, 
  UserPlus, 
  Plus,
  Users,
  Code,
  Award,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle,
  FileText,
  Check,
  Eye
} from 'lucide-react';
import { apiGetSocialPortfolio } from '../services/api';

export const Recruitment: React.FC = () => {
  const { 
    jobs, 
    candidates, 
    addJob, 
    editJob,
    updateJobStatus, 
    addCandidate, 
    triggerAIScreening,
    activeRole,
    currentUser,
    socialPortfolio,
    connectSocial,
    syncSocial,
    disconnectSocial,
    updateCandidateStage,
    updateProfile,
    settings
  } = useHR();
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Candidate connection form states
  const [githubUser, setGithubUser] = useState('');
  const [leetcodeUser, setLeetcodeUser] = useState('');
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Candidate Profile completion form states
  const [profileName, setProfileName] = useState(currentUser?.full_name || '');
  const [profileCollege, setProfileCollege] = useState(currentUser?.college || '');
  const [profileGender, setProfileGender] = useState(currentUser?.gender || '');
  const [profileYear, setProfileYear] = useState(currentUser?.year_of_passing || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Resume File Upload inside Profile
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Sync profile form inputs with currentUser context state
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.full_name || '');
      setProfileCollege(currentUser.college || '');
      setProfileGender(currentUser.gender || '');
      setProfileYear(currentUser.year_of_passing || '');
      setProfilePhone(currentUser.phone || '');
    }
  }, [currentUser]);

  // Candidate Application Modal states
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyPhone, setApplyPhone] = useState('');
  const [applyName, setApplyName] = useState('');
  const [applyCollege, setApplyCollege] = useState('');
  const [applyGender, setApplyGender] = useState('');
  const [applyYear, setApplyYear] = useState('');
  const [applyFile, setApplyFile] = useState<File | null>(null);
  const [applyJobTitle, setApplyJobTitle] = useState('');
  const [applyText, setApplyText] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // HR Candidate detailed inspection drawer/modal
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [candPortfolio, setCandPortfolio] = useState<any | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  
  // New Job opening form state
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [maxApplications, setMaxApplications] = useState<number | ''>('');

  // New Candidate application form state
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candRole, setCandRole] = useState('Senior Frontend Engineer');
  const [candPhone, setCandPhone] = useState('');
  const [showAddCandModal, setShowAddCandModal] = useState(false);

  const handleSubmitJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    const requirements = requirementsInput.split(',').map(r => r.trim()).filter(Boolean);
    if (editingJobId) {
      editJob(editingJobId, {
        title,
        department,
        description,
        requirements,
        max_applications: maxApplications === '' ? undefined : Number(maxApplications)
      });
    } else {
      addJob({
        title,
        department,
        description,
        requirements,
        max_applications: maxApplications === '' ? undefined : Number(maxApplications)
      });
    }
    handleCloseJobModal();
  };

  const handleCloseJobModal = () => {
    setEditingJobId(null);
    setTitle('');
    setDescription('');
    setRequirementsInput('');
    setMaxApplications('');
    setShowAddJobModal(false);
  };

  const handleEditJobClick = (job: any) => {
    setEditingJobId(job.id);
    setTitle(job.title);
    setDepartment(job.department);
    setDescription(job.description);
    setRequirementsInput(job.requirements.join(', '));
    setMaxApplications(job.max_applications || '');
    setShowAddJobModal(true);
  };

  const handleSubmitCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName || !candEmail || !candRole) {
      alert("Please fill all required fields including Position Applied.");
      return;
    }
    addCandidate({
      name: candName,
      email: candEmail,
      roleApplied: candRole,
      phone: candPhone,
      resumeName: 'Uploaded_Resume.pdf'
    });
    setCandName('');
    setCandEmail('');
    setCandPhone('');
    setCandRole('');
    setShowAddCandModal(false);
  };

  const handleConnect = async (platform: string, username: string) => {
    if (!username) return;
    setIsConnecting(platform);
    const success = await connectSocial(platform, username);
    setIsConnecting(null);
    if (success) {
      if (platform === 'github') setGithubUser('');
      if (platform === 'leetcode') setLeetcodeUser('');
    }
  };

  const handleSync = async (platform: string) => {
    setIsSyncing(platform);
    await syncSocial(platform);
    setIsSyncing(null);
  };

  const handleDisconnect = async (platform: string) => {
    if (confirm(`Are you sure you want to disconnect ${platform}?`)) {
      await disconnectSocial(platform);
    }
  };

  const handleOpenApplyModal = (jobTitle: string) => {
    setApplyJobTitle(jobTitle);
    setApplyName(currentUser?.full_name || '');
    setApplyCollege(currentUser?.college || '');
    setApplyGender(currentUser?.gender || '');
    setApplyYear(currentUser?.year_of_passing || '');
    setApplyPhone(currentUser?.phone || '');
    setApplyFile(null);
    setApplyText('');
    setApplyError('');
    setApplySuccess('');
    setShowApplyModal(true);
  };

  const handleOpenViewProfile = async (cand: any) => {
    setSelectedCandidate(cand);
    setCandPortfolio(null);
    setLoadingPortfolio(true);
    try {
      const data = await apiGetSocialPortfolio(cand.id);
      setCandPortfolio(data);
    } catch (err) {
      console.error('Failed to load candidate portfolio:', err);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    const success = await updateProfile({
      full_name: profileName,
      college: profileCollege,
      gender: profileGender,
      year_of_passing: profileYear,
      phone: profilePhone,
    });
    setProfileSaving(false);
    if (success) {
      setProfileMsg('✅ Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } else {
      setProfileMsg('❌ Failed to update profile.');
    }
  };

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;
    setUploadingResume(true);
    setUploadMsg('');
    try {
      const myApplications = candidates.filter(c => c.email === currentUser?.email);
      const activeCand = myApplications.find(c => c.id === selectedAppId) || myApplications[0];
      if (activeCand) {
        await triggerAIScreening(activeCand.id, resumeFile);
        setUploadMsg('✅ Resume uploaded and scanned successfully!');
        setTimeout(() => setUploadMsg(''), 4000);
      } else {
        setUploadMsg('❌ Please submit an application first before uploading.');
      }
    } catch (err: any) {
      setUploadMsg('❌ Upload failed: ' + (err.message || 'unknown error'));
    } finally {
      setUploadingResume(false);
      setResumeFile(null);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError('');
    setApplySuccess('');

    if (!applyName || !applyCollege || !applyGender || !applyYear || !applyPhone) {
      setApplyError('Please fill in all candidate profile details.');
      return;
    }

    if (!applyFile && !applyText) {
      setApplyError('Please upload a PDF/TXT resume file or paste your resume text.');
      return;
    }

    setIsApplying(true);
    try {
      const resName = applyFile ? applyFile.name : 'Applied_Resume.pdf';
      const newCand = await addCandidate({
        name: applyName,
        email: currentUser?.email || '',
        roleApplied: applyJobTitle,
        phone: applyPhone,
        college: applyCollege,
        gender: applyGender,
        year_of_passing: applyYear,
        resumeName: resName
      });

      await updateProfile({
        full_name: applyName,
        college: applyCollege,
        gender: applyGender,
        year_of_passing: applyYear,
        phone: applyPhone
      });

      setApplySuccess('Your application has been successfully submitted! Analyzing resume...');

      if (newCand) {
        if (applyFile) {
          await triggerAIScreening(newCand.id, applyFile);
        } else {
          await triggerAIScreening(newCand.id, undefined, applyText);
        }
      }

      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess('');
      }, 3000);
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit application.');
    } finally {
      setIsApplying(false);
    }
  };

  // Simulate AI Scan with loading spinner
  const handleAIScan = (candidateId: string, resumeText: string) => {
    setScanningId(candidateId);
    setTimeout(() => {
      triggerAIScreening(candidateId, undefined, resumeText);
      setScanningId(null);
    }, 2000);
  };

  // Preset resumes to test screening immediately
  const presetResumes = [
    {
      name: "Rachel Green (React Expert)",
      text: "Rachel Green. Senior Frontend Engineer. Expert in React hooks, context API, TypeScript interfaces, TailwindCSS styling, and Next.js. 6 years experience building premium dashboards and web platforms."
    },
    {
      name: "David Beckham (Design Minded)",
      text: "David Beckham. Experienced HTML and CSS styling developer. Familiar with Figma assets. Weak experience with React and JS state. No TypeScript familiarity."
    },
    {
      name: "Jon Vance (Clean Code)",
      text: "Jonathan Vance. Senior Software Engineer. Proficient in React, TypeScript, Node.js, and CI/CD pipelines. Extensive architectural leadership on enterprise apps."
    }
  ];

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/10 text-green-500 border border-green-500/20';
    if (score >= 70) return 'bg-palette-4/10 text-palette-4 border border-palette-4/20';
    if (score > 0) return 'bg-red-500/10 text-red-500 border border-red-500/20';
    return 'bg-gray-100 text-gray-500';
  };

  if (activeRole === 'Candidate') {
    const myApplications = candidates.filter(c => c.email === currentUser?.email);
    const selfCand = myApplications.find(c => c.id === selectedAppId) || myApplications[0];
    const totalApps = myApplications.length;
    const maxApps = settings?.maxApplicationsPerCandidate || 1;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans">
        {/* Welcome Card */}
        <div className="premium-card p-6 bg-gradient-to-r from-palette-1 to-palette-1/90 text-white relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[20rem] h-[20rem] bg-palette-4/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <span className="bg-palette-5 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Candidate Dashboard
              </span>
              <h2 className="font-extrabold text-2xl mt-2">Welcome, {currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Job Seeker'}!</h2>
              <p className="text-xs text-palette-2/80 mt-1">
                Track your application status and sync your developer portfolio to stand out.
              </p>
            </div>
            {totalApps < maxApps && (
              <button
                onClick={() => handleOpenApplyModal(jobs[0]?.title || 'Senior Software Engineer')}
                className="bg-palette-5 hover:bg-palette-4 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                Start Application
              </button>
            )}
          </div>
        </div>

        {/* Profile Card & Resume Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Form (2 cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-palette-1 dark:text-white text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-palette-4" />
                  Your Profile Details
                </h3>
                <p className="text-xs text-palette-2 mt-0.5">Keep your details up-to-date for recruitment managers.</p>
              </div>
              {(!currentUser?.college || !currentUser?.gender || !currentUser?.year_of_passing || !currentUser?.phone) && (
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  ⚠️ Profile Incomplete
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">University / College</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={profileCollege}
                  onChange={(e) => setProfileCollege(e.target.value)}
                  className="w-full border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                <select
                  required
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                  className="w-full border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Year of Passing</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026"
                  value={profileYear}
                  onChange={(e) => setProfileYear(e.target.value)}
                  className="w-full border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1-555-0199"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-palette-4 font-bold">{profileMsg}</span>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Resume Upload (1 col) */}
          <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-palette-1 dark:text-white text-base mb-2 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-palette-4" />
                Resume Center
              </h3>
              <p className="text-xs text-palette-2 leading-relaxed">
                Upload your resume in PDF/TXT format to parse experience and calculate your ATS match score.
              </p>

              {selfCand && selfCand.resumeName && (
                <div className="mt-3 p-3 bg-palette-3/30 dark:bg-slate-800/40 rounded-xl flex items-center gap-2 border border-palette-2/10">
                  <FileText className="w-5 h-5 text-palette-4 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-palette-1 dark:text-white truncate">{selfCand.resumeName}</p>
                    <p className="text-[10px] text-palette-2 font-medium">ATS Match: {selfCand.atsScore > 0 ? `${selfCand.atsScore}%` : 'Not Scanned'}</p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleResumeUpload} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  required
                  onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-palette-4/15 file:text-palette-4 hover:file:bg-palette-4/20 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[10.5px] text-palette-4 font-bold">{uploadMsg}</span>
                <button
                  type="submit"
                  disabled={uploadingResume || !resumeFile}
                  className="bg-palette-1 hover:bg-palette-4 text-white font-bold text-[10.5px] px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {uploadingResume ? 'Scanning...' : 'Upload & Scan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Application Tracker */}
        {selfCand && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="font-extrabold text-palette-1 dark:text-white text-base flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-palette-4" />
                  Your Application Tracker
                </h3>
                {myApplications.length > 1 && (
                  <select
                    value={selfCand.id || ''}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                    className="bg-palette-3/50 border border-palette-2/20 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold dark:bg-slate-800 dark:text-white"
                  >
                    {myApplications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.roleApplied}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs font-bold text-palette-1 dark:text-white mb-4">
                Active Role: <span className="text-palette-4">{selfCand.roleApplied}</span>
              </p>
              
              <div className="relative mt-8 px-4 flex justify-between items-center">
                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[3px] bg-palette-3 dark:bg-slate-800/40 z-0" />
                <div 
                  className="absolute left-8 top-1/2 -translate-y-1/2 h-[3px] bg-palette-4 z-0 transition-all duration-500" 
                  style={{
                    width: 
                      selfCand.stage === 'applied' ? '0%' :
                      selfCand.stage === 'screening' ? '33%' :
                      selfCand.stage === 'interviewing' ? '66%' :
                      selfCand.stage === 'offered' ? '100%' : '0%'
                  }}
                />

                {['applied', 'screening', 'interviewing', 'offered'].map((stg, i) => {
                  const stagesList = ['applied', 'screening', 'interviewing', 'offered'];
                  const currentIndex = stagesList.indexOf(selfCand.stage);
                  const isCompleted = i < currentIndex || selfCand.stage === 'offered';
                  const isActive = i === currentIndex && selfCand.stage !== 'offered';
                  
                  return (
                    <div key={stg} className="flex flex-col items-center relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all duration-300 ${
                        isCompleted ? 'bg-palette-4 border-palette-4 text-white' :
                        isActive ? 'bg-palette-5 border-palette-5 text-white animate-pulse' :
                        'bg-white dark:bg-slate-900 border-palette-2/30 dark:border-slate-700 text-palette-2 dark:text-slate-500'
                      }`}>
                        {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider mt-2.5 ${
                        isActive ? 'text-palette-5' : 
                        isCompleted ? 'text-palette-1 dark:text-slate-200' : 'text-palette-2 dark:text-slate-500'
                      }`}>
                        {stg}
                      </span>
                    </div>
                  );
                })}
              </div>

              {selfCand.stage === 'rejected' && (
                <div className="mt-8 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold px-4 py-3 rounded-xl animate-in fade-in">
                  We appreciate your interest in NexHire. Unfortunately, we have decided to move forward with other candidates at this time.
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-palette-1 dark:text-white text-base mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-palette-4" />
                  AI Scorecard
                </h3>
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800/65 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-palette-2 dark:text-slate-400 font-semibold">ATS Match Score:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${getScoreBadgeColor(selfCand.atsScore)}`}>
                        {selfCand.atsScore > 0 ? `${selfCand.atsScore}%` : 'Not Scanned'}
                      </span>
                    </div>

                    {selfCand.atsScore > 0 && selfCand.breakdown && (
                      <div className="space-y-1.5 pt-3">
                        <div className="flex items-center gap-2 text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="w-16 shrink-0">Keywords:</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-palette-4" style={{ width: `${((selfCand.breakdown.keyword_coverage?.score || selfCand.breakdown.keyword_match || 0) / 30) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right shrink-0 font-bold">{selfCand.breakdown.keyword_coverage?.score || selfCand.breakdown.keyword_match || 0}/30</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="w-16 shrink-0">Skills:</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-palette-5" style={{ width: `${((selfCand.breakdown.skills_match?.score || selfCand.breakdown.skills_match || 0) / 25) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right shrink-0 font-bold">{selfCand.breakdown.skills_match?.score || selfCand.breakdown.skills_match || 0}/25</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className="w-16 shrink-0">Experience:</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-600" style={{ width: `${((selfCand.breakdown.experience_match?.score || selfCand.breakdown.experience_match || 0) / 20) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right shrink-0 font-bold">{selfCand.breakdown.experience_match?.score || selfCand.breakdown.experience_match || 0}/20</span>
                        </div>
                      </div>
                    )}

                    {selfCand.atsScore > 0 && selfCand.matchDetails && selfCand.matchDetails.length > 0 && (
                      <div className="pt-3 flex flex-wrap gap-1.5">
                        {selfCand.matchDetails.slice(0, 3).map((detail: string, i: number) => {
                          const isGap = detail.startsWith('Gap');
                          const text = detail.replace(/^(Strength: |Gap: )/, '');
                          return (
                            <span key={i} className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold border ${isGap ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                              {text}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/65 pb-2">
                    <span className="text-xs text-palette-2 dark:text-slate-400 font-semibold">Portfolio Score:</span>
                    <span className="text-xs font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                      {socialPortfolio?.overall_score || 0} / 1000
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-palette-2 dark:text-slate-400 font-semibold">Interview Score:</span>
                    <span className="text-xs font-extrabold bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                      {selfCand.interviewScore > 0 ? `${selfCand.interviewScore}%` : 'Pending Interview'}
                    </span>
                  </div>
                </div>
              </div>

              {selfCand.stage === 'interviewing' && (
                <button
                  onClick={() => { window.location.hash = '#/interview'; }}
                  className="mt-6 w-full text-center bg-palette-5 hover:bg-palette-4 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md block cursor-pointer"
                >
                  Start Your AI Video Interview
                </button>
              )}
            </div>
          </div>
        )}

        {/* Developer Profile Connections */}
        {selfCand && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-palette-1 dark:text-white text-base">Developer Portfolio Integration</h3>
                <p className="text-xs text-palette-2 mt-0.5">Link your developer profiles to calculate your composite score.</p>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-palette-2 uppercase tracking-wider">Overall Portfolio Score</span>
                <span className="text-xl font-extrabold text-palette-4">{socialPortfolio?.overall_score || 0} <span className="text-xs font-medium text-palette-2">/ 1000</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* GitHub */}
              <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-palette-1 dark:text-white">
                        <Code className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-palette-1 dark:text-white">GitHub Integration</h4>
                        <p className="text-[10px] text-palette-2">Sync repositories, stars, and language diversity.</p>
                      </div>
                    </div>
                    {socialPortfolio?.profiles?.github && (
                      <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Connected
                      </span>
                    )}
                  </div>

                  {socialPortfolio?.profiles?.github ? (
                    <div className="space-y-4 py-2 animate-in fade-in">
                      <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2">
                        <span className="text-palette-2 font-semibold">Username:</span>
                        <span className="font-bold text-palette-1 dark:text-white flex items-center gap-1">
                          {socialPortfolio.profiles.github.username}
                          <a 
                            href={`https://github.com/${socialPortfolio.profiles.github.username}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-palette-4 hover:text-palette-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 bg-palette-3/30 dark:bg-slate-800/40 p-3 rounded-2xl">
                        <div>
                          <span className="block text-[9px] text-palette-2 uppercase font-extrabold">Public Repos</span>
                          <span className="text-sm font-extrabold text-palette-1 dark:text-white">
                            {socialPortfolio.profiles.github.data?.public_repos || 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-palette-2 uppercase font-extrabold">Total Stars</span>
                          <span className="text-sm font-extrabold text-palette-1 dark:text-white">
                            {socialPortfolio.profiles.github.data?.total_stars || 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-palette-2 uppercase font-extrabold">Languages</span>
                          <span className="text-sm font-extrabold text-palette-1 dark:text-white">
                            {socialPortfolio.profiles.github.data?.language_diversity || 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-palette-2 uppercase font-extrabold">Contributions</span>
                          <span className="text-sm font-extrabold text-palette-1 dark:text-white">
                            {socialPortfolio.profiles.github.data?.contributions_year || 0}
                          </span>
                        </div>
                      </div>

                      <p className="text-[9px] text-palette-2 text-right">
                        Synced: {socialPortfolio.profiles.github.synced_at || 'Just now'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-6 space-y-4">
                      <p className="text-xs text-palette-2 dark:text-slate-400">
                        Link your GitHub account to showcase your public repositories and project popularity.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="GitHub username"
                          value={githubUser}
                          onChange={(e) => setGithubUser(e.target.value)}
                          className="flex-1 border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-palette-3/50 dark:bg-slate-800 text-palette-1 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-4 font-semibold"
                        />
                        <button
                          onClick={() => handleConnect('github', githubUser)}
                          disabled={isConnecting === 'github' || !githubUser}
                          className="bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          {isConnecting === 'github' ? 'Linking...' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {socialPortfolio?.profiles?.github && (
                  <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
                    <button
                      onClick={() => handleSync('github')}
                      disabled={isSyncing === 'github'}
                      className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-palette-2/30 dark:border-slate-700 text-palette-1 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing === 'github' ? 'animate-spin' : ''}`} />
                      {isSyncing === 'github' ? 'Syncing...' : 'Sync Stats'}
                    </button>
                    <button
                      onClick={() => handleDisconnect('github')}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-2 rounded-xl transition-all cursor-pointer"
                      title="Disconnect GitHub"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* LeetCode */}
              <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-palette-1 dark:text-white">
                        <Users className="w-6 h-6 text-palette-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-palette-1 dark:text-white">LeetCode Integration</h4>
                        <p className="text-[10px] text-palette-2">Sync solved algorithmic problems & rankings.</p>
                      </div>
                    </div>
                    {socialPortfolio?.profiles?.leetcode && (
                      <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Connected
                      </span>
                    )}
                  </div>

                  {socialPortfolio?.profiles?.leetcode ? (
                    <div className="space-y-4 py-2 animate-in fade-in">
                      <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2">
                        <span className="text-palette-2 font-semibold">Username:</span>
                        <span className="font-bold text-palette-1 dark:text-white flex items-center gap-1">
                          {socialPortfolio.profiles.leetcode.username}
                          <a 
                            href={`https://leetcode.com/${socialPortfolio.profiles.leetcode.username}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-palette-4 hover:text-palette-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 bg-palette-3/30 dark:bg-slate-800/40 p-3 rounded-2xl">
                        <div>
                          <span className="block text-[8px] text-palette-2 uppercase font-extrabold">Solved</span>
                          <span className="text-xs font-extrabold text-palette-1 dark:text-white">
                            {socialPortfolio.profiles.leetcode.data?.total_solved || 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-palette-2 uppercase font-extrabold">Hard</span>
                          <span className="text-xs font-extrabold text-palette-1 dark:text-white">
                            {socialPortfolio.profiles.leetcode.data?.hard_solved || 0}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-palette-2 uppercase font-extrabold">Rating</span>
                          <span className="text-xs font-extrabold text-palette-1 dark:text-white">
                            {Math.round(socialPortfolio.profiles.leetcode.data?.contest_rating || 0)}
                          </span>
                        </div>
                      </div>

                      <p className="text-[9px] text-palette-2 text-right">
                        Synced: {socialPortfolio.profiles.leetcode.synced_at || 'Just now'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-6 space-y-4">
                      <p className="text-xs text-palette-2 dark:text-slate-400">
                        Link your LeetCode profile to prove your algorithm skills and competitive coding performance.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="LeetCode username"
                          value={leetcodeUser}
                          onChange={(e) => setLeetcodeUser(e.target.value)}
                          className="flex-1 border border-palette-2/30 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-palette-3/50 dark:bg-slate-800 text-palette-1 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-4 font-semibold"
                        />
                        <button
                          onClick={() => handleConnect('leetcode', leetcodeUser)}
                          disabled={isConnecting === 'leetcode' || !leetcodeUser}
                          className="bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          {isConnecting === 'leetcode' ? 'Linking...' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {socialPortfolio?.profiles?.leetcode && (
                  <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
                    <button
                      onClick={() => handleSync('leetcode')}
                      disabled={isSyncing === 'leetcode'}
                      className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-palette-2/30 dark:border-slate-700 text-palette-1 dark:text-slate-200 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing === 'leetcode' ? 'animate-spin' : ''}`} />
                      {isSyncing === 'leetcode' ? 'Syncing...' : 'Sync Stats'}
                    </button>
                    <button
                      onClick={() => handleDisconnect('leetcode')}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-2 rounded-xl transition-all cursor-pointer"
                      title="Disconnect LeetCode"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Achievements List */}
            {socialPortfolio?.achievements?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-in zoom-in-95">
                <h4 className="font-extrabold text-palette-1 dark:text-white text-xs uppercase tracking-wider mb-3">Earned Achievements</h4>
                <div className="flex flex-wrap gap-2.5">
                  {socialPortfolio.achievements.map((badge: string) => (
                    <span key={badge} className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                      <Award className="w-4 h-4 text-amber-500" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Corporate Jobs explorer */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-palette-2/20 dark:border-slate-800 shadow-sm">
            <h3 className="font-extrabold text-palette-1 dark:text-white text-base">Corporate Openings</h3>
            <p className="text-xs text-palette-2 mt-0.5">Explore career opportunities and apply to open requisitions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map(job => {
              const isAppliedToThis = selfCand && selfCand.roleApplied === job.title;
              return (
                <div key={job.id} className="premium-card p-6 flex flex-col justify-between bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="bg-palette-3 dark:bg-slate-800 text-palette-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {job.department}
                      </span>
                      {isAppliedToThis && (
                        <span className="bg-green-500/15 text-green-500 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Applied Position
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-palette-1 dark:text-white text-base mt-3">{job.title}</h4>
                    <p className="text-xs text-palette-1/70 dark:text-slate-400 mt-1.5 leading-relaxed truncate">{job.description}</p>
                    
                    <div className="mt-4 space-y-1">
                      <p className="text-[10px] font-bold text-palette-1/50 dark:text-slate-500 uppercase tracking-wider">Requirements:</p>
                      <div className="flex flex-wrap gap-1">
                        {job.requirements.map((req, i) => (
                          <span key={i} className="bg-palette-3 dark:bg-slate-800 text-palette-1/80 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-md">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-palette-2/10 dark:border-slate-800/60 flex justify-between items-center text-xs">
                    <span className="text-palette-2 font-medium">Requisition: {job.id}</span>
                    {isAppliedToThis ? (
                      <span className="text-green-500 font-bold italic">
                        Applied (Under Evaluation)
                      </span>
                    ) : totalApps < maxApps ? (
                      <button 
                        onClick={() => handleOpenApplyModal(job.title)}
                        className="bg-palette-4 hover:bg-palette-1 text-white text-[10.5px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Apply Now
                      </button>
                    ) : (
                      <span className="text-palette-2 font-bold italic">
                        Locked ({maxApps} application(s) max)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Apply Requisition Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-palette-1/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-palette-2/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-palette-2/15 dark:border-slate-800 flex justify-between items-center bg-palette-3/30 dark:bg-slate-800/40">
                <h3 className="font-extrabold text-lg text-palette-1 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-palette-4" />
                  Submit Application
                </h3>
                <button onClick={() => setShowApplyModal(false)} className="text-palette-2 hover:text-palette-1 dark:text-slate-400 dark:hover:text-white">
                  <span className="text-lg font-bold leading-none">&times;</span>
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <p className="text-xs text-palette-2 dark:text-slate-400">
                  You are applying for the position of <strong className="text-palette-4">{applyJobTitle}</strong>.
                </p>

                {applyError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold px-4 py-2.5 rounded-xl">
                    {applyError}
                  </div>
                )}
                {applySuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold px-4 py-2.5 rounded-xl">
                    {applySuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rachel Green"
                      value={applyName}
                      onChange={(e) => setApplyName(e.target.value)}
                      className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">University / College</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stanford University"
                      value={applyCollege}
                      onChange={(e) => setApplyCollege(e.target.value)}
                      className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                    <select
                      required
                      value={applyGender}
                      onChange={(e) => setApplyGender(e.target.value)}
                      className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Year of Passing</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026"
                      value={applyYear}
                      onChange={(e) => setApplyYear(e.target.value)}
                      className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1-555-0199"
                    value={applyPhone}
                    onChange={(e) => setApplyPhone(e.target.value)}
                    className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-sm focus:outline-none bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                  />
                </div>

                <div className="border-t border-palette-2/15 dark:border-slate-800 pt-3">
                  <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Upload Resume (PDF/TXT)</label>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => setApplyFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-palette-4/15 file:text-palette-4 hover:file:bg-palette-4/20 cursor-pointer"
                  />
                </div>

                {!applyFile && (
                  <div>
                    <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Or Paste Resume Text (for AI parsing)</label>
                    <textarea
                      required={!applyFile}
                      rows={4}
                      placeholder="Paste your education, skills, and work history here..."
                      value={applyText}
                      onChange={(e) => setApplyText(e.target.value)}
                      className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none bg-palette-3/30 dark:bg-slate-800 text-palette-1 dark:text-white font-semibold"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-palette-2/10 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 border border-palette-2/40 dark:border-slate-750 text-palette-1 dark:text-slate-200 hover:bg-palette-3/50 dark:hover:bg-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-4 py-2 bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isApplying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Upper Grid: Job Openings & ATS scanner playground */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Openings (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-palette-2/20 shadow-sm">
            <div>
              <h3 className="font-extrabold text-palette-1 text-base">Corporate Openings</h3>
              <p className="text-xs text-palette-2 mt-0.5">Active requisitions and qualification thresholds.</p>
            </div>
            <button
              onClick={() => {
                setEditingJobId(null);
                setTitle('');
                setDescription('');
                setRequirementsInput('');
                setShowAddJobModal(true);
              }}
              className="flex items-center gap-1 bg-palette-4 hover:bg-palette-1 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Job
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map(job => (
              <div key={job.id} className="premium-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="bg-palette-3 text-palette-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {job.department}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      job.status === 'open' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-palette-1 text-base mt-3">{job.title}</h4>
                  <p className="text-xs text-palette-1/70 mt-1.5 leading-relaxed truncate">{job.description}</p>
                  
                  {/* Requirements List */}
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-bold text-palette-1/50 uppercase tracking-wider">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.requirements.map((req, i) => (
                        <span key={i} className="bg-palette-3 text-palette-1/80 text-[10px] px-2 py-0.5 rounded-md">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-palette-2/10 flex justify-between items-center text-xs">
                  <span className="text-palette-2 font-medium">Requisition: {job.id}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleEditJobClick(job)}
                      className="text-palette-5 font-bold hover:text-palette-1 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => updateJobStatus(job.id, job.status === 'open' ? 'closed' : 'open')}
                      className="text-palette-4 font-bold hover:text-palette-1 transition-colors"
                    >
                      Toggle Status
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ATS Sandbox Scanner */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-6 bg-gradient-to-br from-palette-1 to-palette-1/90 text-white relative overflow-hidden">
            <h3 className="font-extrabold text-base flex items-center gap-2 relative z-10">
              <Sparkles className="w-5 h-5 text-palette-5" />
              ATS Scanner Sandbox
            </h3>
            <p className="text-xs text-palette-2 mt-1 relative z-10 leading-relaxed">
              Test the AI ATS scoring engine by clicking a sample candidate resume profile below.
            </p>

            <div className="mt-6 space-y-3 relative z-10">
              {presetResumes.map((resume, idx) => (
                <div 
                  key={idx}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3.5 cursor-pointer transition-colors duration-200"
                  onClick={() => {
                    // Find a candidate to assign this to, or create one on-the-fly
                    const engineerCandidates = candidates.filter(c => c.stage === 'applied' || c.stage === 'screening');
                    if (engineerCandidates.length > 0) {
                      handleAIScan(engineerCandidates[0].id, resume.text);
                    } else {
                      alert("Please add a candidate in the list below first!");
                    }
                  }}
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-palette-5" />
                    {resume.name}
                  </p>
                  <p className="text-[10px] text-palette-2 mt-1 truncate italic">
                    "{resume.text.substring(0, 80)}..."
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-palette-2/60 mt-4 leading-normal">
              *Applies scanning algorithms to the top pending candidate in the list.
            </p>
          </div>
        </div>
      </div>

      {/* Candidate applications table */}
      <div className="bg-white rounded-2xl border border-palette-2/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-palette-2/20 flex flex-col sm:flex-row justify-between items-center gap-4 bg-palette-3/15">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-palette-4" />
            <h3 className="font-extrabold text-palette-1 text-base">Candidate Leaderboard & Funnel</h3>
          </div>
          <button
            onClick={() => setShowAddCandModal(true)}
            className="flex items-center gap-1 bg-palette-4 hover:bg-palette-1 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-palette-3/30 text-palette-1/70 text-xs font-extrabold uppercase border-b border-palette-2/20">
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-6">Role Applied</th>
                <th className="py-4 px-6">ATS Score</th>
                <th className="py-4 px-6">AI Match Details</th>
                <th className="py-4 px-6">Hiring Stage</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-palette-2/10 text-xs font-semibold text-palette-1/80">
              {[...candidates].sort((a, b) => b.atsScore - a.atsScore).map((cand, index) => (
                <tr key={cand.id} className="hover:bg-palette-3/10 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="bg-palette-5/10 text-palette-5 border border-palette-5/20 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-palette-1">{cand.name}</p>
                        <p className="text-palette-2 mt-0.5">{cand.email} • {cand.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold">{cand.roleApplied}</td>
                  
                  {/* ATS Score */}
                  <td className="py-4 px-6">
                    {scanningId === cand.id ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 border-2 border-palette-5 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] text-palette-5 font-bold">Analyzing...</span>
                      </div>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getScoreBadgeColor(cand.atsScore)}`}>
                        {cand.atsScore > 0 ? `${cand.atsScore}%` : 'Not Scanned'}
                      </span>
                    )}
                  </td>

                  {/* AI Match Details */}
                  <td className="py-4 px-6 max-w-[320px]">
                    <div className="space-y-1">
                      {cand.matchDetails.map((det, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <span className="text-palette-5 mt-0.5">•</span>
                          <span className="text-[10.5px] leading-relaxed text-palette-1/70">{det}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Stage */}
                  <td className="py-4 px-6">
                    <select
                      value={cand.stage}
                      onChange={(e) => updateCandidateStage(cand.id, e.target.value as any)}
                      className="bg-white border border-palette-2/30 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                    >
                      <option value="applied">applied</option>
                      <option value="screening">screening</option>
                      <option value="interviewing">interviewing</option>
                      <option value="offered">offered</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button
                        onClick={() => handleOpenViewProfile(cand)}
                        className="bg-palette-4 hover:bg-palette-1 text-white px-2.5 py-1.5 rounded-lg text-[10px] transition-colors flex items-center gap-1 font-extrabold cursor-pointer hover:scale-105 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Profile
                      </button>

                      {cand.atsScore === 0 && (
                        <button
                          onClick={() => handleAIScan(cand.id, `${cand.name}. Qualified applicant with experience as a ${cand.roleApplied}. Strong competencies in React hooks, state management, and modern responsive design.`)}
                          className="bg-palette-1 text-white px-2.5 py-1.5 rounded-lg text-[10px] hover:bg-palette-4 transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-palette-5" />
                          Scan ATS
                        </button>
                      )}
                      
                      {cand.stage === 'interviewing' && (
                        <span className="text-palette-5 text-[10px] font-bold bg-palette-5/10 px-2 py-1 rounded-md animate-pulse">
                          Live Interview Ready
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddCandModal && (
        <div className="fixed inset-0 bg-palette-1/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-palette-2/20 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-palette-2/15 flex justify-between items-center bg-palette-3/30">
              <h3 className="font-extrabold text-lg text-palette-1 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-palette-4" />
                Add Job Candidate
              </h3>
              <button onClick={() => setShowAddCandModal(false)} className="text-palette-2 hover:text-palette-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCandidate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Candidate Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Green"
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. r.green@gmail.com"
                  value={candEmail}
                  onChange={(e) => setCandEmail(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1-555-0182"
                  value={candPhone}
                  onChange={(e) => setCandPhone(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Position Applied</label>
                  <select
                  value={candRole}
                  onChange={(e) => setCandRole(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                >
                  <option value="" disabled>Select a position</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.title}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-palette-2/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCandModal(false)}
                  className="px-4 py-2 border border-palette-2/40 text-palette-1 hover:bg-palette-3/50 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Job Modal */}
      {showAddJobModal && (
        <div className="fixed inset-0 bg-palette-1/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-palette-2/20 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-palette-2/15 flex justify-between items-center bg-palette-3/30">
              <h3 className="font-extrabold text-lg text-palette-1 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-palette-4" />
                {editingJobId ? 'Edit Job Opening' : 'Add Job Opening'}
              </h3>
              <button onClick={handleCloseJobModal} className="text-palette-2 hover:text-palette-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitJob} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4 bg-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="People & Culture">People & Culture</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Description Summary</label>
                <textarea
                  required
                  placeholder="Brief summary of duties..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4 h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Requirements (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React experience, TypeScript competency, Git skills"
                  value={requirementsInput}
                  onChange={(e) => setRequirementsInput(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Max Applications (Optional)</label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  placeholder="e.g. 50"
                  value={maxApplications}
                  onChange={(e) => setMaxApplications(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div className="pt-4 border-t border-palette-2/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseJobModal}
                  className="px-4 py-2 border border-palette-2/40 text-palette-1 hover:bg-palette-3/50 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  {editingJobId ? 'Save Changes' : 'Post Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR Candidate Profile Inspector Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-palette-1/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-palette-2/20 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-palette-2/15 dark:border-slate-800 flex justify-between items-center bg-palette-3/30 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <Users className="w-6 h-6 text-palette-4" />
                <div>
                  <h3 className="font-extrabold text-lg text-palette-1 dark:text-white leading-none">
                    Candidate Profile Inspector
                  </h3>
                  <p className="text-[11px] text-palette-2 mt-1">Detailed evaluation and developer portfolio sync verification.</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedCandidate(null); setCandPortfolio(null); }} 
                className="text-palette-2 hover:text-palette-1 dark:text-slate-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Profile Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-palette-3/20 dark:bg-slate-800/35 p-5 rounded-2xl border border-palette-2/10">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">Full Name</span>
                  <span className="text-sm font-bold text-palette-1 dark:text-white">{selectedCandidate.name}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">Position Applied</span>
                  <span className="text-sm font-bold text-palette-4">{selectedCandidate.roleApplied}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">Email Address</span>
                  <span className="text-xs font-bold text-palette-1 dark:text-white">{selectedCandidate.email}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">Phone Number</span>
                  <span className="text-xs font-bold text-palette-1 dark:text-white">{selectedCandidate.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">University / College</span>
                  <span className="text-xs font-bold text-palette-1 dark:text-white">{selectedCandidate.college || 'Not provided'}</span>
                </div>
                <div className="flex gap-6">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">Gender</span>
                    <span className="text-xs font-bold text-palette-1 dark:text-white">{selectedCandidate.gender || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">Passing Year</span>
                    <span className="text-xs font-bold text-palette-1 dark:text-white">{selectedCandidate.year_of_passing || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Evaluation Scores */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/25 p-3.5 rounded-2xl text-center border border-slate-100 dark:border-slate-800/40">
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">ATS Score</span>
                  <span className={`block text-xl font-extrabold mt-1 ${
                    selectedCandidate.atsScore >= 85 ? 'text-green-500' :
                    selectedCandidate.atsScore >= 70 ? 'text-palette-4' : 'text-red-500'
                  }`}>
                    {selectedCandidate.atsScore > 0 ? `${selectedCandidate.atsScore}%` : 'Pending'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/25 p-3.5 rounded-2xl text-center border border-slate-100 dark:border-slate-800/40">
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">Portfolio Score</span>
                  <span className="block text-xl font-extrabold mt-1 text-blue-500">
                    {candPortfolio?.overall_score || selectedCandidate.portfolioScore || 0} / 1000
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/25 p-3.5 rounded-2xl text-center border border-slate-100 dark:border-slate-800/40">
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-palette-2">Interview Score</span>
                  <span className="block text-xl font-extrabold mt-1 text-purple-500">
                    {selectedCandidate.interviewScore > 0 ? `${selectedCandidate.interviewScore}%` : 'Pending'}
                  </span>
                </div>
              </div>

              {/* ATS Resume Analysis Details */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-palette-1 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-palette-4" />
                  ATS Resume Screening Feedback
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800/40 text-[11px] leading-relaxed text-palette-1/70">
                  <p className="font-bold text-palette-2 mb-1">Extracted Resume Name: <span className="text-palette-1 dark:text-slate-300">{selectedCandidate.resumeName}</span></p>
                  <div className="space-y-1">
                    {selectedCandidate.matchDetails.map((det: string, i: number) => (
                      <div key={i} className="flex items-start gap-1">
                        <span className="text-palette-5 mt-0.5">•</span>
                        <span>{det}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Connected Developer Profiles details */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-palette-1 dark:text-white flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-palette-4" />
                  GitHub & LeetCode Connected Profiles
                </h4>

                {loadingPortfolio ? (
                  <div className="py-6 flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-palette-4 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-palette-2 font-bold">Loading developer portfolios...</span>
                  </div>
                ) : candPortfolio ? (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Overall Score & Badges */}
                    {candPortfolio.achievements?.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                        {candPortfolio.achievements.map((badge: string) => (
                          <span key={badge} className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-xl">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* GitHub section */}
                      {candPortfolio.profiles?.github ? (
                        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                          <h5 className="font-extrabold text-xs text-palette-1 dark:text-white flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                            <span>GitHub: <span className="text-palette-4">@{candPortfolio.profiles.github.username}</span></span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-extrabold">
                              Score: {Math.round(candPortfolio.profiles.github.score)}
                            </span>
                          </h5>
                          <div className="grid grid-cols-2 gap-2.5 mt-2.5 text-[11px]">
                            <div>
                              <span className="text-palette-2 block">Public Repos:</span>
                              <span className="font-bold text-palette-1 dark:text-white">{candPortfolio.profiles.github.data?.public_repos || 0}</span>
                            </div>
                            <div>
                              <span className="text-palette-2 block">Total Stars:</span>
                              <span className="font-bold text-palette-1 dark:text-white">{candPortfolio.profiles.github.data?.total_stars || 0}</span>
                            </div>
                            <div>
                              <span className="text-palette-2 block">Languages Count:</span>
                              <span className="font-bold text-palette-1 dark:text-white">{candPortfolio.profiles.github.data?.language_diversity || 0}</span>
                            </div>
                            <div>
                              <span className="text-palette-2 block">Contributions:</span>
                              <span className="font-bold text-palette-1 dark:text-white">{candPortfolio.profiles.github.data?.contributions_year || 0}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-palette-2">
                          GitHub account not connected
                        </div>
                      )}

                      {/* LeetCode section */}
                      {candPortfolio.profiles?.leetcode ? (
                        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                          <h5 className="font-extrabold text-xs text-palette-1 dark:text-white flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                            <span>LeetCode: <span className="text-palette-4">@{candPortfolio.profiles.leetcode.username}</span></span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-extrabold">
                              Score: {Math.round(candPortfolio.profiles.leetcode.score)}
                            </span>
                          </h5>
                          <div className="grid grid-cols-2 gap-2.5 mt-2.5 text-[11px]">
                            <div>
                              <span className="text-palette-2 block">Problems Solved:</span>
                              <span className="font-bold text-palette-1 dark:text-white">{candPortfolio.profiles.leetcode.data?.total_solved || 0}</span>
                            </div>
                            <div>
                              <span className="text-palette-2 block">Hard Problems:</span>
                              <span className="font-bold text-palette-1 dark:text-white">{candPortfolio.profiles.leetcode.data?.hard_solved || 0}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-palette-2 block">Contest Rating:</span>
                              <span className="font-bold text-palette-1 dark:text-white">{Math.round(candPortfolio.profiles.leetcode.data?.contest_rating || 0)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-palette-2">
                          LeetCode account not connected
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-palette-2">
                    No developer profiles synced.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-palette-2/15 dark:border-slate-800 bg-palette-3/20 dark:bg-slate-800/20 flex justify-end">
              <button
                type="button"
                onClick={() => { setSelectedCandidate(null); setCandPortfolio(null); }}
                className="px-4 py-2 bg-palette-1 text-white hover:bg-palette-4 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
