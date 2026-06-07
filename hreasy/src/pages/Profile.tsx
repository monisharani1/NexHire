import React, { useState, useEffect } from 'react';
import { useHR } from '../context/HRContext';
import { apiGetMe, apiUpdateProfile } from '../services/api';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Edit2, Check
} from 'lucide-react';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiGetMe();
      setProfile(data);
      setFormData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiUpdateProfile(formData);
      setProfile(updated);
      setFormData(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-palette-2">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-12 text-center text-red-500">Failed to load profile.</div>;
  }

  const roleBadgeColor = 
    profile.role === 'Student' || profile.role === 'Candidate' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
    profile.role === 'HR' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
    'bg-palette-4/10 text-palette-4 border-palette-4/20';

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-palette-1 dark:text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-palette-4" />
              Edit Profile
            </h2>
            <div className="flex gap-2">
              <button onClick={() => { setFormData(profile); setIsEditing(false); }} className="px-4 py-2 rounded-xl text-xs font-bold text-palette-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-palette-4 hover:bg-palette-1 text-white transition-colors flex items-center gap-1">
                {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Full Name *</label>
                <input name="full_name" value={formData.full_name || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Tagline</label>
                <input name="tagline" value={formData.tagline || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Phone</label>
                <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Location</label>
                <input name="location" value={formData.location || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-palette-1 dark:text-white mb-4">Professional Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Current Status</label>
                  <select name="status" value={formData.status || 'Student'} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white">
                    <option>Student</option>
                    <option>Working Professional</option>
                    <option>HR / Recruiter</option>
                  </select>
                </div>
                {formData.status === 'Student' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">College</label>
                      <input name="college" value={formData.college || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Degree</label>
                      <input name="degree" value={formData.degree || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Graduation Year</label>
                      <input type="number" name="grad_year" value={formData.grad_year || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Company</label>
                      <input name="company" value={formData.company || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">Designation</label>
                      <input name="designation" value={formData.designation || ''} onChange={handleChange} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <label className="block text-[10px] font-bold text-palette-1/70 dark:text-slate-400 uppercase mb-1">About Me (Bio)</label>
              <textarea name="bio" value={formData.bio || ''} onChange={handleChange} rows={4} className="w-full border border-palette-2/40 dark:border-slate-700 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold text-palette-1 dark:text-white resize-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-palette-2/20 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Cover Banner */}
        <div className="h-32 bg-gradient-to-r from-palette-4 to-palette-5 opacity-80" />
        
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-6">
              <div className="-mt-12 w-28 h-28 rounded-full bg-white dark:bg-slate-800 border-[5px] border-white dark:border-slate-900 flex items-center justify-center overflow-hidden shadow-md shrink-0 relative z-10">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-palette-2/50" />
                )}
              </div>
              <div className="pt-4">
                <h1 className="text-3xl font-extrabold text-palette-1 dark:text-white flex items-center gap-3">
                  {profile.full_name || 'Anonymous User'}
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${roleBadgeColor}`}>
                    {profile.role}
                  </span>
                </h1>
                <p className="text-sm font-semibold text-palette-4 mt-1">{profile.tagline || 'No tagline set.'}</p>
                <div className="flex items-center gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-3">
                  {profile.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{profile.location}</span>}
                  {profile.status === 'Student' && profile.college && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" />{profile.college}</span>}
                  {profile.status !== 'Student' && profile.company && <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" />{profile.company}</span>}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(true)}
              className="mt-4 px-5 py-2.5 bg-slate-100 hover:bg-palette-3 dark:bg-slate-800 dark:hover:bg-slate-700 text-palette-1 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              <div>
                <h3 className="text-xs font-extrabold text-palette-1/50 dark:text-slate-500 uppercase tracking-wider mb-2">About</h3>
                <p className="text-sm text-palette-1/80 dark:text-slate-300 leading-relaxed font-medium">
                  {profile.bio || 'This user has not written a bio yet.'}
                </p>
              </div>
            </div>

            <div className="col-span-1 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-extrabold text-palette-1/50 dark:text-slate-500 uppercase tracking-wider mb-3">Contact Info</h3>
                <div className="space-y-3 text-xs font-semibold text-palette-1/80 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-palette-2" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-palette-2" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
