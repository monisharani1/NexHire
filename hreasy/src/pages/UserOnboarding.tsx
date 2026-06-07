import React, { useState, useEffect } from 'react';
import { apiUpdateProfile, apiGetMe } from '../services/api';
import { 
  User, Briefcase, GraduationCap, Link as LinkIcon, AlertCircle 
} from 'lucide-react';

export const UserOnboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    gender: 'Prefer not to say',
    status: 'Student',
    
    // Student
    college: '',
    degree: 'B.E.',
    branch: '',
    grad_year: new Date().getFullYear(),
    
    // Professional
    company: '',
    designation: '',
    department: '',
    experience_years: 0,
    
    // Universal
    tagline: '',
    bio: '',
    github: '',
    linkedin: '',
    portfolio: ''
  });

  useEffect(() => {
    // Pre-fill existing data
    apiGetMe().then(user => {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || '',
        location: user.location || '',
        gender: user.gender || 'Prefer not to say',
        status: user.status || 'Student',
        college: user.college || '',
        degree: user.degree || 'B.E.',
        branch: user.branch || '',
        grad_year: user.grad_year || new Date().getFullYear(),
        company: user.company || '',
        designation: user.designation || '',
        department: user.department || '',
        experience_years: user.experience_years || 0,
        tagline: user.tagline || '',
        bio: user.bio || ''
      }));
    }).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setError('');
    // Validation
    if (step === 1 && !formData.full_name) {
      setError('Full Name is required.');
      return;
    }
    if (step === 2) {
      if (formData.status === 'Student' && (!formData.college || !formData.degree || !formData.branch || !formData.grad_year)) {
        setError('Please fill in all required Student fields.');
        return;
      }
      if ((formData.status === 'Working Professional' || formData.status === 'HR / Recruiter') && (!formData.company || !formData.designation)) {
        setError('Please fill in all required Professional fields.');
        return;
      }
    }
    if (step === 3 && !formData.tagline) {
      setError('Tagline is required.');
      return;
    }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await apiUpdateProfile({
        ...formData,
        onboarding_complete: true
      });
      // Force reload to apply changes globally
      window.location.hash = '#/dashboard';
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const generateTaglineSuggestion = () => {
    if (formData.status === 'Student') {
      return `${formData.degree} ${formData.branch} @ ${formData.college || 'University'} | Open to Internships`;
    } else if (formData.status === 'Working Professional') {
      return `${formData.designation} @ ${formData.company} | Open to Work`;
    } else if (formData.status === 'HR / Recruiter') {
      return `${formData.designation} @ ${formData.company} | Talent Acquisition`;
    }
    return '';
  };

  return (
    <div className="max-w-2xl mx-auto my-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-palette-4 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <h2 className="text-2xl font-extrabold text-palette-1 dark:text-white mt-4 mb-2">Welcome to NexHire!</h2>
        <p className="text-sm text-palette-2 dark:text-slate-400 mb-8">Let's set up your profile so recruiters can find you.</p>

        {error && (
          <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 mb-6 text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="min-h-[300px]">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
              <h3 className="font-bold text-palette-1 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <User className="w-5 h-5 text-palette-5" />
                Step 1 of 4: Basic Info
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input name="full_name" value={formData.full_name} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="John Doe" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="+1 234 567 890" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                <input name="location" value={formData.location} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. San Francisco, CA" />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
              <h3 className="font-bold text-palette-1 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <Briefcase className="w-5 h-5 text-palette-4" />
                Step 2 of 4: Professional Status
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">I am a... *</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none mb-6">
                  <option>Student</option>
                  <option>Working Professional</option>
                  <option>Job Seeker</option>
                  <option>Freelancer</option>
                  <option>HR / Recruiter</option>
                </select>
              </div>

              {formData.status === 'Student' && (
                <div className="space-y-4 bg-palette-3/30 dark:bg-slate-850 p-4 rounded-2xl border border-palette-2/15 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">College / University *</label>
                    <input name="college" value={formData.college} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. Stanford University" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Degree *</label>
                      <input name="degree" value={formData.degree} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. B.S. / B.E." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Branch / Major *</label>
                      <input name="branch" value={formData.branch} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. Computer Science" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Graduation Year *</label>
                    <input type="number" name="grad_year" value={formData.grad_year} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" />
                  </div>
                </div>
              )}

              {(formData.status === 'Working Professional' || formData.status === 'HR / Recruiter') && (
                <div className="space-y-4 bg-palette-3/30 dark:bg-slate-850 p-4 rounded-2xl border border-palette-2/15 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Current Company *</label>
                    <input name="company" value={formData.company} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. Google" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Designation *</label>
                      <input name="designation" value={formData.designation} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. Software Engineer" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Years of Experience</label>
                      <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
              <h3 className="font-bold text-palette-1 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <GraduationCap className="w-5 h-5 text-palette-5" />
                Step 3 of 4: Your Tagline & Bio
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tagline *</label>
                <input name="tagline" value={formData.tagline} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none mb-2" placeholder="e.g. Full Stack Developer | Next.js Enthusiast" />
                <button 
                  onClick={() => setFormData({ ...formData, tagline: generateTaglineSuggestion() })}
                  className="text-[10px] font-bold text-palette-4 hover:text-palette-1 transition-colors"
                >
                  ✨ Auto-generate suggestion
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">About Me (Bio)</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none resize-none" placeholder="Write a short summary about yourself... (max 300 chars)" maxLength={300} />
                <div className="text-right text-[10px] text-palette-2 dark:text-slate-500 font-semibold mt-1">
                  {formData.bio.length} / 300
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
              <h3 className="font-bold text-palette-1 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <LinkIcon className="w-5 h-5 text-palette-4" />
                Step 4 of 4: Social Links (Optional)
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">GitHub Profile</label>
                <input name="github" value={formData.github} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. github.com/username" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">LinkedIn Profile</label>
                <input name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. linkedin.com/in/username" />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 dark:text-slate-400 uppercase tracking-wider mb-1.5">Portfolio URL</label>
                <input name="portfolio" value={formData.portfolio} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white focus:ring-2 focus:ring-palette-4 outline-none" placeholder="e.g. myportfolio.dev" />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl text-xs font-semibold leading-relaxed mt-6">
                You can always connect your accounts later on your profile page to fetch real-time developer metrics!
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-palette-2 dark:text-slate-400 hover:bg-palette-3 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            ← Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="px-8 py-2.5 rounded-xl text-xs font-bold bg-palette-1 hover:bg-palette-4 text-white shadow-md transition-colors cursor-pointer"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 rounded-xl text-xs font-bold bg-palette-5 hover:bg-palette-4 text-white shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
