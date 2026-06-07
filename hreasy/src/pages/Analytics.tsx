import React from 'react';
import { useHR } from '../context/HRContext';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { candidates, payroll, teams } = useHR();

  // 1. Hiring Funnel Data
  const stages = ['applied', 'screening', 'interviewing', 'offered', 'rejected'];
  const funnelData = stages.map(stage => ({
    name: stage.toUpperCase(),
    Candidates: candidates.filter(c => c.stage === stage).length
  }));

  // 2. Department Productivity Data
  const productivityData = teams.map(t => ({
    name: t.name,
    Score: t.productivityScore,
    Progress: t.progress
  }));

  // 3. Attrition Risk Forecast (AI Prediction)
  // Hardcoded premium curve indicating predicted attrition risk index (%) by dept over 6 months
  const attritionData = [
    { month: 'Jun 26', Engineering: 12, Design: 8, Product: 5 },
    { month: 'Jul 26', Engineering: 15, Design: 10, Product: 6 },
    { month: 'Aug 26', Engineering: 24, Design: 12, Product: 8 }, // Spike due to tight release
    { month: 'Sep 26', Engineering: 18, Design: 9, Product: 7 },
    { month: 'Oct 26', Engineering: 10, Design: 6, Product: 5 },
    { month: 'Nov 26', Engineering: 8, Design: 5, Product: 4 },
  ];

  // 4. Payroll Spending History Data (Mocked monthly cost trend)
  const payrollTrendData = [
    { month: 'Jan 26', Spend: 28400 },
    { month: 'Feb 26', Spend: 29100 },
    { month: 'Mar 26', Spend: 32000 },
    { month: 'Apr 26', Spend: 31200 },
    { month: 'May 26', Spend: 33500 },
    { month: 'Jun 26', Spend: payroll.reduce((acc, p) => acc + p.baseSalary + p.bonus - p.deductions, 0) },
  ];

  const COLORS = ['#1B325F', '#3A89C9', '#F26C4F', '#9CC4E4', '#7C3AED'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Overview Analytics Banner */}
      <div className="bg-white p-6 rounded-2xl border border-palette-2/20 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-palette-3/15">
        <div>
          <h3 className="font-extrabold text-palette-1 text-base">Corporate Analytics Console</h3>
          <p className="text-xs text-palette-2 mt-0.5">Statistical breakdowns, financial trajectories, and AI-predicted risks.</p>
        </div>
        <div className="bg-palette-5/10 text-palette-5 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Attrition & Productivity ML Forecast Mode</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Attrition Risk Forecast (AI Model) */}
        <div className="premium-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-extrabold text-palette-1 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-palette-5 animate-pulse" />
              AI Attrition Risk Forecast (6-Month Projection)
            </h4>
            <span className="text-[10px] bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded-full uppercase">
              Predictive
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attritionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9F2F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Line type="monotone" dataKey="Engineering" stroke="#F26C4F" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Design" stroke="#3A89C9" strokeWidth={2} />
                <Line type="monotone" dataKey="Product" stroke="#1B325F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-palette-2/10 bg-red-500/5 p-3.5 rounded-xl border border-red-500/15 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-palette-1/80 leading-relaxed font-semibold">
              <strong className="text-red-600">Model analysis:</strong> Engineering attrition risk peaks at 24% in August. This aligns with sequential tight sprint completions reported in updates. Recommend scheduling holiday breaks or spacing sprints to reduce churn by 14%.
            </p>
          </div>
        </div>

        {/* Hiring Funnel Breakdown */}
        <div className="premium-card p-6">
          <h4 className="font-extrabold text-palette-1 text-base mb-6">
            Recruitment Funnel & Pipeline Volume
          </h4>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9F2F9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="Candidates" fill="#3A89C9" radius={[6, 6, 0, 0]}>
                  {funnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-palette-2 font-semibold mt-4 text-center">
            Distribution of candidate flow across pipeline stages
          </p>
        </div>

        {/* Financial Spend Trend */}
        <div className="premium-card p-6">
          <h4 className="font-extrabold text-palette-1 text-base mb-6">
            Monthly Payroll Outlay Trend
          </h4>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9F2F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [value ? `$${Number(value).toLocaleString()}` : '$0', 'Outlay']} />
                <Line type="monotone" dataKey="Spend" stroke="#1B325F" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-palette-2/10 flex justify-between items-center text-xs">
            <span className="text-palette-2 font-semibold">Active month: June 2026</span>
            <span className="flex items-center gap-1 font-bold text-green-500">
              <TrendingUp className="w-4 h-4" />
              Budget growth stable
            </span>
          </div>
        </div>

        {/* Productivity vs progress */}
        <div className="premium-card p-6">
          <h4 className="font-extrabold text-palette-1 text-base mb-6">
            Team Performance vs. Progress Correlation
          </h4>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9F2F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Bar dataKey="Score" name="Productivity Index (%)" fill="#1B325F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Progress" name="Milestone Progress (%)" fill="#9CC4E4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] text-palette-2 font-semibold mt-4 text-center">
            Correlation showing team speed output mapped to actual ticket progress
          </p>
        </div>
        
      </div>
    </div>
  );
};
