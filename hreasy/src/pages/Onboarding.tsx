import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { 
  UserPlus, 
  Sparkles, 
  Square, 
  FileText, 
  ClipboardCheck,
  Clock,
  Briefcase,
  User
} from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { employees, addEmployee } = useHR();
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedChecklist, setGeneratedChecklist] = useState<string[] | null>(null);
  
  // Onboard mode tab state
  const [onboardMode, setOnboardMode] = useState<'create' | 'select'>('create');

  // Form states for creating a new hire
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newRole, setNewRole] = useState('Software Engineer');

  // Document status tracking
  const [docsStatus] = useState({
    contract: 'Pending Upload',
    idVerification: 'Pending Review',
    bankDetails: 'Approved',
    benefitsEnrollment: 'Pending Upload'
  });

  const onboardingEmployees = employees.filter(e => {
    // Treat employees hired recently as onboarding for demo
    const year = parseInt(e.joinDate.split('-')[0]);
    return year === 2026 || year === 2024 || year === 2025;
  });

  const getDocStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'Pending Review': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      default: return 'bg-red-500/10 text-red-500 border border-red-500/20';
    }
  };

  const handleRegisterNewHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newRole) {
      alert('Please fill in Name, Email, and Role fields.');
      return;
    }

    // Predict the ID that context will assign
    const nextId = `emp-${employees.length + 1}`;

    // Add employee to global state
    addEmployee({
      name: newName,
      email: newEmail,
      department: newDept,
      role: newRole,
      status: 'active',
      performanceRating: 5.0
    });

    // Reset create fields
    setNewName('');
    setNewEmail('');
    setNewDept('Engineering');
    setNewRole('Software Engineer');

    // Automatically select the newly created employee and toggle check status
    setSelectedEmpId(nextId);
    setGeneratedChecklist(null);
    alert(`Successfully registered ${newName}! You can now generate their onboarding checklist.`);
  };

  const handleGenerateChecklist = () => {
    if (!selectedEmpId) return;
    setIsGenerating(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      const emp = employees.find(e => e.id === selectedEmpId);
      if (!emp) return;

      const baseList = [
        "Read corporate code of conduct and sign compliance disclosure",
        "Configure company Slack, email profile, and calendar slots",
        "Complete HR information registry and bank routing details",
        "One-on-one introduction call with Sarah Jenkins (People & Culture)"
      ];

      let roleSpecific = [];
      if (emp.department === 'Engineering') {
        roleSpecific = [
          `Pull code from repository and configure local Docker environments`,
          `Read engineering guidelines on architecture and linting standards`,
          `Pair programming sprint review session with Alice Smith (Lead Dev)`,
          `Resolve first dashboard issue ticket and submit pull request`
        ];
      } else if (emp.department === 'Design') {
        roleSpecific = [
          `Review corporate UI Figma design systems and library files`,
          `Sync session on layout requirements with Bob Johnson (Lead Designer)`,
          `Establish user survey analytics file credentials`,
          `Review checkout portal user journey maps`
        ];
      } else {
        roleSpecific = [
          `Product roadmap review with Emma Watson (Product Manager)`,
          `Set up project timeline tracking credentials`,
          `Schedule department feedback loops`
        ];
      }

      setGeneratedChecklist([...baseList, ...roleSpecific]);
      setIsGenerating(false);
    }, 1500);
  };

  const selectedEmp = employees.find(e => e.id === selectedEmpId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Onboarding Control Form (1 col) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="premium-card p-6 sticky top-24 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
          <h3 className="font-extrabold text-palette-1 dark:text-white text-base mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-palette-4 dark:text-palette-2" />
            New Hire Onboarding
          </h3>

          {/* Toggle modes */}
          <div className="flex bg-palette-3 dark:bg-slate-800 p-1.5 rounded-2xl mb-4 border border-palette-2/15 dark:border-slate-700/50">
            <button
              onClick={() => { setOnboardMode('create'); setSelectedEmpId(''); setGeneratedChecklist(null); }}
              className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                onboardMode === 'create'
                  ? 'bg-white dark:bg-slate-900 text-palette-1 dark:text-white shadow-md'
                  : 'text-palette-2 dark:text-slate-400 hover:text-palette-1'
              }`}
            >
              Onboard New Hire
            </button>
            <button
              onClick={() => { setOnboardMode('select'); setSelectedEmpId(''); setGeneratedChecklist(null); }}
              className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                onboardMode === 'select'
                  ? 'bg-white dark:bg-slate-900 text-palette-1 dark:text-white shadow-md'
                  : 'text-palette-2 dark:text-slate-400 hover:text-palette-1'
              }`}
            >
              Select Existing
            </button>
          </div>

          {onboardMode === 'create' ? (
            <form onSubmit={handleRegisterNewHire} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Liam Anderson"
                  className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. l.anderson@enterprise.com"
                  className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none transition-colors"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="People & Culture">People & Culture</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. QA Automation"
                    className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-palette-5 hover:bg-palette-1 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" />
                Register New Hire
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Select Onboarding Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => {
                    setSelectedEmpId(e.target.value);
                    setGeneratedChecklist(null);
                  }}
                  className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none transition-colors"
                >
                  <option value="">-- Choose Employee --</option>
                  {onboardingEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedEmp && (
            <div className="border-t border-palette-2/15 dark:border-slate-800/80 pt-4 mt-4 space-y-4 animate-in fade-in duration-300">
              <div className="bg-palette-3/50 dark:bg-slate-800/40 p-4 rounded-xl border border-palette-2/20 dark:border-slate-850 space-y-2.5 text-xs font-semibold text-palette-1/80 dark:text-slate-300 transition-colors">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-palette-2 dark:text-slate-450" />
                  <span>NAME: {selectedEmp.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-palette-2 dark:text-slate-450" />
                  <span>DEPT: {selectedEmp.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-palette-2 dark:text-slate-450" />
                  <span>START DATE: {selectedEmp.joinDate}</span>
                </div>
              </div>

              <button
                disabled={isGenerating}
                onClick={handleGenerateChecklist}
                className="w-full flex items-center justify-center gap-1.5 bg-palette-4 hover:bg-palette-1 disabled:bg-palette-2 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-palette-5" />
                {isGenerating ? 'Compiling Checklist...' : 'Generate AI Checklist'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checklist & Document Hub (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Document Tracking Hub */}
        <div className="premium-card p-6 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
          <h4 className="font-extrabold text-palette-1 dark:text-white text-base mb-4 flex items-center gap-2 border-b border-palette-2/15 dark:border-slate-800 pb-4">
            <FileText className="w-5 h-5 text-palette-4 dark:text-palette-2" />
            Mandatory Documents Tracker
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-palette-3/30 dark:bg-slate-850 p-3 rounded-xl border border-palette-2/10 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-palette-1 dark:text-slate-200">
              <span>Signed Employment Contract:</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${getDocStatusBadge(docsStatus.contract)}`}>
                {docsStatus.contract}
              </span>
            </div>
            <div className="bg-palette-3/30 dark:bg-slate-850 p-3 rounded-xl border border-palette-2/10 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-palette-1 dark:text-slate-200">
              <span>National ID / Passport Verification:</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${getDocStatusBadge(docsStatus.idVerification)}`}>
                {docsStatus.idVerification}
              </span>
            </div>
            <div className="bg-palette-3/30 dark:bg-slate-850 p-3 rounded-xl border border-palette-2/10 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-palette-1 dark:text-slate-200">
              <span>Bank Account Routing Details:</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${getDocStatusBadge(docsStatus.bankDetails)}`}>
                {docsStatus.bankDetails}
              </span>
            </div>
            <div className="bg-palette-3/30 dark:bg-slate-850 p-3 rounded-xl border border-palette-2/10 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-palette-1 dark:text-slate-200">
              <span>Medical Insurance Enrollment:</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] ${getDocStatusBadge(docsStatus.benefitsEnrollment)}`}>
                {docsStatus.benefitsEnrollment}
              </span>
            </div>
          </div>
        </div>

        {/* AI Generated Checklist Results */}
        <div className="premium-card p-6 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
          <h4 className="font-extrabold text-palette-1 dark:text-white text-base mb-6 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-palette-5" />
            AI-Compiled Milestones Check
          </h4>

          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-palette-5 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-palette-1 dark:text-white animate-pulse">Scanning role specifications and compiling training tracks...</p>
            </div>
          ) : generatedChecklist ? (
            <div className="space-y-3.5 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-palette-3 to-palette-3/35 dark:from-slate-800 dark:to-slate-800/30 p-4 rounded-xl border border-palette-2/25 dark:border-slate-700/50 mb-4 flex gap-2">
                <Sparkles className="w-5 h-5 text-palette-5 shrink-0 mt-0.5" />
                <p className="text-xs text-palette-1/80 dark:text-slate-350 leading-relaxed font-semibold italic">
                  "AI has generated {generatedChecklist.length} tasks specifically matched for {selectedEmp?.name}'s role as {selectedEmp?.role}."
                </p>
              </div>

              {generatedChecklist.map((task, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 bg-white dark:bg-slate-950 hover:bg-palette-3/20 dark:hover:bg-slate-800/35 border border-palette-2/10 dark:border-slate-800/60 rounded-xl cursor-pointer transition-colors"
                >
                  <Square className="w-4.5 h-4.5 text-palette-2 dark:text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-palette-1 dark:text-slate-200 leading-relaxed">{task}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 border-dashed border-2 border-palette-2/30 dark:border-slate-800 rounded-xl text-center text-palette-2 dark:text-slate-500 text-xs">
              Select or register an employee and click "Generate AI Checklist" to compile personalized training tasks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
