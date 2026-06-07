import React, { useState } from 'react';
import { useHR, type Team } from '../context/HRContext';
import { 
  Network, 
  Sparkles, 
  AlertTriangle,
  TrendingUp, 
  Plus, 
  X,
  Settings
} from 'lucide-react';

export const Teams: React.FC = () => {
  const { teams, employees, addTeam, updateTeam } = useHR();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // New Team Form State
  const [name, setName] = useState('');
  const [leadId, setLeadId] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  // Edit Team State
  const [editMembers, setEditMembers] = useState<string[]>([]);
  const [editLeadId, setEditLeadId] = useState('');

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !leadId) return;
    addTeam({
      name,
      leadId,
      members: [leadId, ...members],
      description,
      progress: 0
    });
    setName('');
    setLeadId('');
    setMembers([]);
    setDescription('');
    setShowAddModal(false);
  };

  const handleMemberToggle = (id: string, isEdit: boolean) => {
    if (isEdit) {
      if (editMembers.includes(id)) {
        setEditMembers(prev => prev.filter(m => m !== id));
      } else {
        setEditMembers(prev => [...prev, id]);
      }
    } else {
      if (members.includes(id)) {
        setMembers(prev => prev.filter(m => m !== id));
      } else {
        setMembers(prev => [...prev, id]);
      }
    }
  };

  const startEditing = (team: Team) => {
    setEditingTeamId(team.id);
    setEditLeadId(team.leadId);
    setEditMembers(team.members);
  };

  const handleSaveEdit = () => {
    if (!editingTeamId) return;
    updateTeam(editingTeamId, {
      leadId: editLeadId,
      members: editMembers
    });
    setEditingTeamId(null);
  };

  // Get Employee details
  const getEmpDetails = (id: string) => {
    return employees.find(e => e.id === id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header action */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-palette-2/20 shadow-sm">
        <div>
          <h3 className="font-extrabold text-palette-1 text-base">Organizational Teams</h3>
          <p className="text-xs text-palette-2 mt-0.5">Track deliverables, lead assignments, and AI performance forecasts.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-palette-4 hover:bg-palette-1 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {/* Grid of Teams */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {teams.map(team => (
          <div key={team.id} className="premium-card p-6 flex flex-col justify-between relative overflow-hidden group">
            {/* Background design elements */}
            <div className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-palette-3/30 rounded-full blur-xl" />

            <div>
              {/* Team title */}
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h4 className="font-extrabold text-palette-1 text-lg">{team.name}</h4>
                  <p className="text-xs text-palette-1/70 mt-1 max-w-[400px] leading-relaxed">{team.description}</p>
                </div>
                
                <button
                  onClick={() => startEditing(team)}
                  className="p-1.5 hover:bg-palette-3 rounded-lg text-palette-2 hover:text-palette-1 transition-colors"
                  title="Configure members"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Lead and productivity metrics */}
              <div className="grid grid-cols-2 gap-4 mt-6 bg-palette-3/40 p-4 rounded-2xl border border-palette-2/10">
                <div>
                  <p className="text-[10px] font-bold text-palette-1/50 uppercase tracking-wider">Team Lead</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <img 
                      src={getEmpDetails(team.leadId)?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                      alt={team.leadName} 
                      className="w-7 h-7 rounded-full border border-palette-2/30 object-cover" 
                    />
                    <span className="text-xs font-extrabold text-palette-1">{team.leadName}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-palette-1/50 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-palette-5" />
                    AI Productivity Score
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="w-4 h-4 text-palette-5" />
                    <span className="text-lg font-black text-palette-1">{team.productivityScore}%</span>
                    <span className="text-[9px] font-bold text-palette-5 bg-palette-5/10 px-1.5 py-0.5 rounded-full uppercase">
                      Optimal
                    </span>
                  </div>
                </div>
              </div>

              {/* Members Avatars Row */}
              <div className="mt-6">
                <p className="text-[10px] font-bold text-palette-1/50 uppercase tracking-wider mb-2">Team Members ({team.members.length})</p>
                <div className="flex -space-x-2.5 overflow-hidden">
                  {team.members.map(memberId => {
                    const member = getEmpDetails(memberId);
                    if (!member) return null;
                    return (
                      <img
                        key={memberId}
                        src={member.avatar}
                        alt={member.name}
                        title={`${member.name} - ${member.role}`}
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Progress & AI Risk Analysis */}
            <div className="mt-6 pt-6 border-t border-palette-2/10">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-palette-1/70">Sprint Execution Progress</span>
                <span className="font-bold text-palette-1">{team.progress}%</span>
              </div>
              <div className="w-full bg-palette-3 h-2 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    team.delayRisk === 'high' 
                      ? 'bg-red-500 animate-pulse' 
                      : team.delayRisk === 'medium'
                      ? 'bg-orange-500'
                      : 'bg-palette-4'
                  }`}
                  style={{ width: `${team.progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center bg-palette-3/30 px-3 py-2 rounded-xl text-[10px]">
                <span className="font-bold text-palette-1/60 uppercase">AI Delay Risk Forecast:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                  team.delayRisk === 'high'
                    ? 'bg-red-500/10 text-red-500'
                    : team.delayRisk === 'medium'
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'bg-green-500/10 text-green-500'
                }`}>
                  {team.delayRisk === 'high' && <AlertTriangle className="w-3 h-3" />}
                  {team.delayRisk}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Team Modal (Inline or Floating) */}
      {editingTeamId && (
        <div className="fixed inset-0 bg-palette-1/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-palette-2/20 overflow-hidden">
            <div className="p-6 border-b border-palette-2/15 flex justify-between items-center bg-palette-3/30">
              <h3 className="font-extrabold text-lg text-palette-1">Configure Team Members</h3>
              <button onClick={() => setEditingTeamId(null)} className="text-palette-2 hover:text-palette-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-2">Team Lead</label>
                <select
                  value={editLeadId}
                  onChange={(e) => setEditLeadId(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-2">Select Members</label>
                <div className="space-y-2 border border-palette-2/20 p-3 rounded-xl max-h-52 overflow-y-auto">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2.5 text-xs text-palette-1 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editMembers.includes(emp.id)}
                        onChange={() => handleMemberToggle(emp.id, true)}
                        className="rounded text-palette-4 focus:ring-palette-4"
                      />
                      <span>{emp.name} ({emp.role})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-palette-2/10 flex justify-end gap-3">
              <button
                onClick={() => setEditingTeamId(null)}
                className="px-4 py-2 border border-palette-2/40 text-palette-1 hover:bg-palette-3/50 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs rounded-xl"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-palette-1/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-palette-2/20 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-palette-2/15 flex justify-between items-center bg-palette-3/30">
              <h3 className="font-extrabold text-lg text-palette-1 flex items-center gap-2">
                <Network className="w-5 h-5 text-palette-4" />
                Create New Team
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-palette-2 hover:text-palette-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beta UX/UI Squad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="What is this team responsible for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4 h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Assign Team Lead</label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  required
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                >
                  <option value="">-- Choose Lead --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Select Members</label>
                <div className="space-y-2 border border-palette-2/20 p-3 rounded-xl max-h-40 overflow-y-auto">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2.5 text-xs text-palette-1 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={members.includes(emp.id)}
                        onChange={() => handleMemberToggle(emp.id, false)}
                        className="rounded text-palette-4 focus:ring-palette-4"
                      />
                      <span>{emp.name} ({emp.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-palette-2/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-palette-2/40 text-palette-1 hover:bg-palette-3/50 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
