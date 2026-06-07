import React, { useState } from 'react';
import { useHR, type Complaint } from '../context/HRContext';
import { 
  AlertTriangle, 
  Send, 
  Sparkles, 
  Check, 
  EyeOff, 
  Eye, 
  Info,
  Calendar,
  User
} from 'lucide-react';

export const Complaints: React.FC = () => {
  const { complaints, submitComplaint, resolveComplaint, activeRole } = useHR();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Complaint['category']>('workload');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    submitComplaint({
      title,
      description,
      category,
      isAnonymous,
      submittedBy: isAnonymous ? 'Anonymous' : 'Alice Smith' // simulated submitter for regular employee
    });

    setTitle('');
    setDescription('');
    setCategory('workload');
    setIsAnonymous(false);
    alert("Grievance submitted successfully. The AI engine is analyzing the sentiment index.");
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'negative': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'positive': return 'bg-green-500/10 text-green-500 border border-green-500/20';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white shadow-sm';
      case 'medium': return 'bg-orange-500 text-white';
      default: return 'bg-palette-2 text-palette-1';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Submit Grievance Form (1 col) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="premium-card p-6 sticky top-24">
          <h3 className="font-extrabold text-palette-1 text-base mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-palette-5" />
            File a Grievance
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Grievance Title</label>
              <input
                type="text"
                required
                placeholder="Briefly state the issue..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4 bg-white"
                >
                  <option value="workload">Workload</option>
                  <option value="workplace">Workplace Environment</option>
                  <option value="harassment">Harassment</option>
                  <option value="benefits">Benefits & Pay</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Privacy Option</label>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    isAnonymous 
                      ? 'bg-palette-1 text-white border-palette-1' 
                      : 'bg-white text-palette-1 border-palette-2/40 hover:bg-palette-3/50'
                  }`}
                >
                  {isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {isAnonymous ? 'Anonymous' : 'Standard'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Detailed Description</label>
              <textarea
                required
                rows={5}
                placeholder="Please describe the incident or situation in detail. If anonymous, we strip metadata to protect your privacy."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
              />
            </div>

            <div className="bg-palette-3/50 p-3.5 rounded-xl border border-palette-2/20 flex gap-2">
              <Info className="w-4 h-4 text-palette-4 shrink-0 mt-0.5" />
              <p className="text-[10px] text-palette-1/70 leading-relaxed font-semibold">
                AI Sentiment Check is applied on submission. Critical reports (burnout warnings, harassment alerts) are auto-escalated immediately.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-palette-4 hover:bg-palette-1 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
              File Grievance
            </button>
          </form>
        </div>
      </div>

      {/* Complaints Pipeline (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-palette-2/20 shadow-sm flex justify-between items-center bg-palette-3/10">
          <div>
            <h3 className="font-extrabold text-palette-1 text-base">Grievance Backlog & Sentiment Analysis</h3>
            <p className="text-xs text-palette-2 mt-0.5">Auto-categorized backlog prioritizing critical employee distress signals.</p>
          </div>
        </div>

        <div className="space-y-4">
          {complaints.map(comp => (
            <div key={comp.id} className="premium-card p-6 space-y-4 relative overflow-hidden">
              {/* Header tags */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-palette-3 text-palette-1/70 text-[9.5px] font-bold px-2 py-0.5 rounded-md uppercase">
                      {comp.category}
                    </span>
                    <span className="text-[9.5px] font-semibold text-palette-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {comp.date}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-palette-1 text-base mt-2">{comp.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getSentimentBadge(comp.sentiment)} flex items-center gap-1`}>
                    <Sparkles className="w-3 h-3 text-palette-5" />
                    AI: {comp.sentiment}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${getPriorityBadge(comp.priority)}`}>
                    {comp.priority} Priority
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-palette-1/80 leading-relaxed whitespace-pre-wrap">
                {comp.description}
              </p>

              {/* Submitter and resolving controls */}
              <div className="pt-4 border-t border-palette-2/10 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-palette-2">
                  <User className="w-4 h-4 text-palette-2" />
                  <span>
                    Submitted by: {comp.isAnonymous ? (
                      <span className="text-palette-5 font-bold italic">Anonymous</span>
                    ) : (
                      <span className="text-palette-1 font-bold">{comp.submittedBy}</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    comp.status === 'resolved' 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  }`}>
                    {comp.status}
                  </span>

                  {comp.status === 'pending' && (activeRole === 'HR' || activeRole === 'Admin') && (
                    <button
                      onClick={() => resolveComplaint(comp.id)}
                      className="bg-palette-4 hover:bg-palette-1 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3 h-3" />
                      Resolve Issue
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
