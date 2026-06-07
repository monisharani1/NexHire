import React, { useState } from 'react';
import { useHR, type LeaveRequest } from '../context/HRContext';
import { 
  Calendar, 
  Send, 
  Sparkles, 
  Check, 
  X, 
  Clock
} from 'lucide-react';

export const LeaveManagement: React.FC = () => {
  const { leaves, employees, submitLeaveRequest, updateLeaveStatus, activeRole } = useHR();
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState<LeaveRequest['type']>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate || !reason) return;

    submitLeaveRequest({
      employeeId,
      type,
      startDate,
      endDate,
      reason
    });

    setEmployeeId('');
    setType('annual');
    setStartDate('');
    setEndDate('');
    setReason('');
    alert("Leave request submitted. AI scheduling engines are assessing capacity logs.");
  };

  const getLeaveTypeBadge = (lType: string) => {
    switch (lType) {
      case 'sick': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'parental': return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      case 'unpaid': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      default: return 'bg-palette-4/10 text-palette-4 border border-palette-4/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Submit Leave Panel (1 col) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="premium-card p-6 sticky top-24">
          <h3 className="font-extrabold text-palette-1 text-base mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-palette-4" />
            Request Time Off
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Employee Submitting</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4 bg-white"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Leave Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4 bg-white"
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="parental">Parental Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Reason / Notes</label>
              <textarea
                required
                rows={3}
                placeholder="State the reason for this request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-palette-4 hover:bg-palette-1 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
              File Request
            </button>
          </form>
        </div>
      </div>

      {/* Leave Inbox (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-palette-2/20 shadow-sm bg-palette-3/15">
          <h3 className="font-extrabold text-palette-1 text-base">Leave Requisitions Inbox</h3>
          <p className="text-xs text-palette-2 mt-0.5">Capacity tracker with automated workload conflict analysis.</p>
        </div>

        <div className="space-y-6">
          {leaves.map(req => (
            <div key={req.id} className="premium-card p-6 space-y-4">
              
              {/* Header and status */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-extrabold text-palette-1 text-base">{req.employeeName}</h4>
                  <p className="text-xs text-palette-2 mt-0.5 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{req.startDate} to {req.endDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase ${getLeaveTypeBadge(req.type)}`}>
                    {req.type}
                  </span>
                  
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    req.status === 'approved' 
                      ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                      : req.status === 'rejected'
                      ? 'bg-red-500/10 text-red-500 border-red-500/20'
                      : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <p className="text-xs text-palette-1/70 leading-relaxed font-semibold italic bg-palette-3/30 p-3 rounded-xl border border-palette-2/10">
                "{req.reason}"
              </p>

              {/* AI Recommendation Engine Card */}
              {req.status === 'pending' && (
                <div className={`p-4 rounded-xl border flex gap-3 ${
                  req.aiRecommendation.action === 'caution'
                    ? 'bg-orange-500/5 border-orange-500/20'
                    : 'bg-green-500/5 border-green-500/20'
                }`}>
                  <div className={`p-2 rounded-xl h-fit shrink-0 ${
                    req.aiRecommendation.action === 'caution'
                      ? 'bg-orange-500/10 text-orange-500'
                      : 'bg-green-500/10 text-green-500'
                  }`}>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-palette-1/60 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Workload Capacity Advisor (AI)</span>
                      {req.aiRecommendation.action === 'caution' && (
                        <span className="bg-orange-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                          Warning
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-palette-1/80 mt-1 leading-relaxed font-semibold">
                      {req.aiRecommendation.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Approve/Reject Controls */}
              {req.status === 'pending' && (activeRole === 'HR' || activeRole === 'Admin') && (
                <div className="pt-4 border-t border-palette-2/10 flex justify-end gap-3">
                  <button
                    onClick={() => updateLeaveStatus(req.id, 'rejected')}
                    className="flex items-center gap-1 border border-palette-2/40 hover:bg-palette-3 text-palette-1 font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Deny request
                  </button>
                  <button
                    onClick={() => updateLeaveStatus(req.id, 'approved')}
                    className="flex items-center gap-1 bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve Leave
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
