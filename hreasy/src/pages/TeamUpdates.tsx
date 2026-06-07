import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { 
  ClipboardList, 
  Send, 
  Sparkles, 
  AlertCircle,
  Clock, 
  AlertTriangle,
  CheckCircle,
  Plus,
  X
} from 'lucide-react';

export const TeamUpdates: React.FC = () => {
  const { teamUpdates, teams, addTeamUpdate } = useHR();
  const [teamId, setTeamId] = useState('');
  const [content, setContent] = useState('');
  const [progress, setProgress] = useState(50);
  const [blockerInput, setBlockerInput] = useState('');
  const [blockers, setBlockers] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !content) return;
    
    addTeamUpdate(teamId, content, progress, blockers);
    
    // Reset Form
    setContent('');
    setBlockerInput('');
    setBlockers([]);
  };

  const handleAddBlocker = () => {
    if (!blockerInput.trim()) return;
    setBlockers(prev => [...prev, blockerInput.trim()]);
    setBlockerInput('');
  };

  const handleRemoveBlocker = (index: number) => {
    setBlockers(prev => prev.filter((_, i) => i !== index));
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'medium': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      default: return 'bg-green-500/10 text-green-500 border border-green-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Left 1 Column: Submit Update Form (visible to Team Lead, Employee, HR) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="premium-card p-6 sticky top-24">
          <h3 className="font-extrabold text-palette-1 text-base mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-palette-4" />
            Submit Work Update
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Select Team</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4 bg-white"
              >
                <option value="">-- Choose Team --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Task Progress ({progress}%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full h-2 bg-palette-3 rounded-lg appearance-none cursor-pointer accent-palette-4"
                />
                <span className="text-xs font-extrabold text-palette-1 w-8 text-right">{progress}%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Accomplishments & Status</label>
              <textarea
                required
                rows={4}
                placeholder="What did the team work on? List any milestones reached."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Add Blockers / Issues</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Waiting on API key"
                  value={blockerInput}
                  onChange={(e) => setBlockerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBlocker())}
                  className="flex-1 border border-palette-2/40 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
                <button
                  type="button"
                  onClick={handleAddBlocker}
                  className="p-1.5 bg-palette-3 text-palette-1 hover:bg-palette-2 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Blockers List */}
              {blockers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {blockers.map((bl, index) => (
                    <span 
                      key={index} 
                      className="bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    >
                      {bl}
                      <button type="button" onClick={() => handleRemoveBlocker(index)} className="hover:text-red-800">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-palette-4 hover:bg-palette-1 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
            >
              <Send className="w-4.5 h-4.5" />
              Publish Status Update
            </button>
          </form>
        </div>
      </div>

      {/* Right 2 Columns: Updates Timeline */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-palette-2/20 shadow-sm">
          <h3 className="font-extrabold text-palette-1 text-base">Updates Timeline</h3>
          <p className="text-xs text-palette-2 mt-0.5">Real-time compilations and AI risk metrics from squad outputs.</p>
        </div>

        <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-palette-2/20">
          {teamUpdates.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-palette-2/20 text-palette-2 text-xs">
              No team updates submitted yet.
            </div>
          ) : (
            teamUpdates.map(update => (
              <div key={update.id} className="relative pl-12 animate-in fade-in duration-300">
                {/* Timeline Icon */}
                <div className="absolute left-3.5 top-1 -translate-x-1/2 w-6 h-6 rounded-full bg-palette-4 border-4 border-white flex items-center justify-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>

                <div className="premium-card p-6 space-y-4">
                  {/* Title & Metadata */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-extrabold text-palette-1 text-base">{update.teamName}</h4>
                      <div className="flex items-center gap-2 text-xs text-palette-2 mt-1 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Submitted on {update.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-palette-4 bg-palette-4/10 px-2.5 py-0.5 rounded-full">
                        {update.progress}% Complete
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${getRiskBadge(update.riskLevel)}`}>
                        {getRiskIcon(update.riskLevel)}
                        Risk: {update.riskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Body Text */}
                  <p className="text-xs text-palette-1/80 leading-relaxed whitespace-pre-wrap">
                    {update.content}
                  </p>

                  {/* Blockers listed */}
                  {update.blockers.length > 0 && (
                    <div className="bg-red-50/30 border border-red-500/10 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Identified Blockers</p>
                      <div className="flex flex-wrap gap-1.5">
                        {update.blockers.map((bl, i) => (
                          <span key={i} className="bg-red-500/10 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {bl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Generated Status Compilation */}
                  <div className="bg-gradient-to-r from-palette-3/80 to-palette-3/30 border border-palette-2/30 rounded-2xl p-4 flex gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-palette-5 shrink-0 h-fit">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-palette-4 uppercase tracking-wider">AI Progress Compiler</p>
                      <p className="text-xs text-palette-1/70 mt-1 leading-relaxed italic">
                        "{update.aiSummary}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
