import React from 'react';
import { useHR } from '../context/HRContext';
import { 
  Users, 
  Network, 
  Calendar, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  Briefcase
} from 'lucide-react';

interface DashboardProps {
  setActivePage: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
  const { employees, teams, leaves, complaints, payroll } = useHR();

  // Metrics
  const activeEmployeesCount = employees.filter(e => e.status === 'active').length;
  const activeTeamsCount = teams.length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;
  const pendingComplaintsCount = complaints.filter(c => c.status === 'pending').length;

  // AI-generated Business Insights based on state
  const getAIInsights = () => {
    const insights = [];

    // Check for high-risk complaints (burnout/stress)
    const burnoutComplaints = complaints.filter(c => c.status === 'pending' && c.priority === 'high' && c.category === 'workload');
    if (burnoutComplaints.length > 0) {
      insights.push({
        id: 'ins-burnout',
        title: 'High Attrition Risk Flagged',
        description: 'AI detected negative sentiment patterns in engineering workload. Team Leads report tight overlapping sprints. Immediate review of engineering allocations is recommended.',
        severity: 'high',
      });
    }

    // Check for leave warnings
    const cautionLeaves = leaves.filter(l => l.status === 'pending' && l.aiRecommendation.action === 'caution');
    if (cautionLeaves.length > 0) {
      insights.push({
        id: 'ins-leave',
        title: 'Milestone Conflict Warning',
        description: `Alice Smith (Team Lead) requested leave during a core release window. AI recommends scheduling a backup lead before approving.`,
        severity: 'medium',
      });
    }

    // Check for payroll anomalies
    const anomaliesCount = payroll.reduce((acc, curr) => acc + curr.anomalies.length, 0);
    if (anomaliesCount > 0) {
      insights.push({
        id: 'ins-payroll',
        title: 'Payroll Anomalies Flagged',
        description: `AI Anomaly Detection identified ${anomaliesCount} flag(s) in payroll worksheets (large bonus thresholds, contract double payments). Please verify compliance.`,
        severity: 'medium',
      });
    }

    // Default optimization insight
    insights.push({
      id: 'ins-recruitment',
      title: 'Recruitment Funnel Optimization',
      description: `AI Screenings show Rachel Green is a 92% match for Senior Frontend Engineer. Schedule an interview to reduce Time-to-Hire by 4 days.`,
      severity: 'low',
    });

    return insights;
  };

  const aiInsights = getAIInsights();

  const cards = [
    { name: 'Active Employees', value: activeEmployeesCount, icon: Users, change: '+2 new this month', color: 'from-blue-500 to-indigo-600', text: 'text-blue-600', page: 'employees' },
    { name: 'Active Teams', value: activeTeamsCount, icon: Network, change: '100% sprint active', color: 'from-teal-500 to-emerald-600', text: 'text-teal-600', page: 'teams' },
    { name: 'Pending Leaves', value: pendingLeavesCount, icon: Calendar, change: `${pendingLeavesCount} requiring review`, color: 'from-orange-400 to-palette-5', text: 'text-orange-600', page: 'leaves' },
    { name: 'Open Complaints', value: pendingComplaintsCount, icon: AlertTriangle, change: pendingComplaintsCount > 0 ? 'Urgent attention' : 'All clear', color: 'from-red-500 to-rose-600', text: 'text-red-600', page: 'complaints' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Welcome banner */}
      <div className="bg-gradient-to-r from-palette-1 to-palette-4 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-palette-2/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-palette-5/10 rounded-full blur-2xl" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-palette-2/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="bg-white/10 text-palette-3 text-xs font-semibold px-3 py-1 rounded-full w-fit flex items-center gap-1.5 backdrop-blur-sm mb-4">
            <Sparkles className="w-3.5 h-3.5 text-palette-5" />
            <span>AI HR Engine version 2.4</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Good morning, Jennifer!</h1>
          <p className="text-palette-3/90 text-sm mt-2 leading-relaxed">
            Your AI HR Assistant has analyzed system telemetry. You have {pendingLeavesCount} leave request(s) and {pendingComplaintsCount} pending complaint(s). Attrition risk index is low (12%).
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div 
              key={card.name} 
              onClick={() => setActivePage(card.page)}
              className="premium-card p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-palette-1/60">{card.name}</p>
                  <p className="text-3xl font-extrabold text-palette-1 mt-1 group-hover:scale-105 transition-transform duration-200">{card.value}</p>
                </div>
                <div className="bg-palette-3 p-3 rounded-xl group-hover:bg-palette-4 group-hover:text-white transition-colors duration-300">
                  <Icon className="w-6 h-6 text-palette-1 group-hover:text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-palette-2/10 flex items-center justify-between text-xs text-palette-2">
                <span className="font-semibold">{card.change}</span>
                <span className="flex items-center gap-0.5 text-palette-4 font-bold group-hover:translate-x-1 transition-transform">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: AI Insights Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-lg text-palette-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-palette-5 animate-pulse" />
                AI Business Insights & Actions
              </h3>
              <span className="text-[10px] bg-palette-5/10 text-palette-5 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Real-Time Telemetry
              </span>
            </div>

            {/* List */}
            <div className="space-y-4">
              {aiInsights.map((insight) => (
                <div 
                  key={insight.id} 
                  className={`p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${
                    insight.severity === 'high' 
                      ? 'bg-red-500/5 border-red-500/20' 
                      : insight.severity === 'medium'
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-palette-4/5 border-palette-4/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      insight.severity === 'high'
                        ? 'bg-red-500/10 text-red-500'
                        : insight.severity === 'medium'
                        ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-palette-4/10 text-palette-4'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-palette-1">{insight.title}</h4>
                      <p className="text-xs text-palette-1/70 leading-relaxed mt-1">{insight.description}</p>
                      
                      {/* Interactive Buttons depending on action */}
                      <div className="mt-3 flex gap-2">
                        {insight.id === 'ins-burnout' && (
                          <button 
                            onClick={() => setActivePage('complaints')}
                            className="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Investigate Grievances
                          </button>
                        )}
                        {insight.id === 'ins-leave' && (
                          <button 
                            onClick={() => setActivePage('leaves')}
                            className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            Open Leave Planner
                          </button>
                        )}
                        {insight.id === 'ins-payroll' && (
                          <button 
                            onClick={() => setActivePage('payroll')}
                            className="bg-palette-4 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-palette-1 transition-colors"
                          >
                            Resolve Anomalies
                          </button>
                        )}
                        {insight.id === 'ins-recruitment' && (
                          <button 
                            onClick={() => setActivePage('recruitment')}
                            className="bg-palette-1 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-palette-4 transition-colors"
                          >
                            View Candidate Leaderboard
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Teams Status & Productivity */}
        <div className="space-y-6">
          <div className="premium-card p-6">
            <h3 className="font-extrabold text-lg text-palette-1 mb-6 flex items-center gap-2">
              <Network className="w-5 h-5 text-palette-4" />
              Active Teams Status
            </h3>

            <div className="space-y-5">
              {teams.map(team => (
                <div key={team.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-palette-1">{team.name}</span>
                    <span className="font-semibold text-palette-2">{team.progress}% Done</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-palette-3 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        team.delayRisk === 'high' 
                          ? 'bg-red-500' 
                          : team.delayRisk === 'medium'
                          ? 'bg-orange-500'
                          : 'bg-palette-4'
                      }`}
                      style={{ width: `${team.progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-palette-2 pt-0.5">
                    <span className="font-medium">Lead: {team.leadName}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full uppercase ${
                      team.delayRisk === 'high'
                        ? 'bg-red-500/10 text-red-500'
                        : team.delayRisk === 'medium'
                        ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-green-500/10 text-green-500'
                    }`}>
                      Risk: {team.delayRisk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setActivePage('teams')}
              className="w-full mt-6 bg-palette-3 text-palette-4 hover:bg-palette-4 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1"
            >
              Go to Teams Manager
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Actions Panel */}
          <div className="premium-card p-6">
            <h3 className="font-bold text-sm text-palette-1 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActivePage('employees')}
                className="bg-palette-3/50 hover:bg-palette-3 border border-palette-2/20 hover:border-palette-2/50 text-left p-3 rounded-xl transition-all duration-200"
              >
                <Users className="w-5 h-5 text-palette-4 mb-2" />
                <p className="text-xs font-bold text-palette-1">Add Employee</p>
                <p className="text-[10px] text-palette-2 mt-0.5">New hire profile</p>
              </button>
              <button 
                onClick={() => setActivePage('recruitment')}
                className="bg-palette-3/50 hover:bg-palette-3 border border-palette-2/20 hover:border-palette-2/50 text-left p-3 rounded-xl transition-all duration-200"
              >
                <Briefcase className="w-5 h-5 text-palette-5 mb-2" />
                <p className="text-xs font-bold text-palette-1">Scan Resume</p>
                <p className="text-[10px] text-palette-2 mt-0.5">ATS screening</p>
              </button>
              <button 
                onClick={() => setActivePage('leaves')}
                className="bg-palette-3/50 hover:bg-palette-3 border border-palette-2/20 hover:border-palette-2/50 text-left p-3 rounded-xl transition-all duration-200"
              >
                <Calendar className="w-5 h-5 text-teal-600 mb-2" />
                <p className="text-xs font-bold text-palette-1">Book Leave</p>
                <p className="text-[10px] text-palette-2 mt-0.5">Leave request</p>
              </button>
              <button 
                onClick={() => setActivePage('complaints')}
                className="bg-palette-3/50 hover:bg-palette-3 border border-palette-2/20 hover:border-palette-2/50 text-left p-3 rounded-xl transition-all duration-200"
              >
                <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-xs font-bold text-palette-1">File Complaint</p>
                <p className="text-[10px] text-palette-2 mt-0.5">Anonymous report</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
