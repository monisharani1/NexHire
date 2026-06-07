import React, { useState } from 'react';
import { useHR, type PayrollRecord } from '../context/HRContext';
import { 
  AlertTriangle, 
  Check, 
  Printer, 
  FileText,
  Edit2,
  CheckCircle2,
  TrendingUp,
  X
} from 'lucide-react';

export const Payroll: React.FC = () => {
  const { payroll, updatePayroll, processAllPayroll } = useHR();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bonusInput, setBonusInput] = useState(0);
  const [dedInput, setDedInput] = useState(0);

  const totalPayroll = payroll.reduce((acc, p) => acc + p.baseSalary + p.bonus - p.deductions, 0);
  const totalBonuses = payroll.reduce((acc, p) => acc + p.bonus, 0);
  const totalDeductions = payroll.reduce((acc, p) => acc + p.deductions, 0);
  const pendingCount = payroll.filter(p => p.status === 'pending').length;

  const handleEditClick = (record: PayrollRecord) => {
    setEditingId(record.id);
    setBonusInput(record.bonus);
    setDedInput(record.deductions);
  };

  const handleSaveClick = (id: string) => {
    updatePayroll(id, bonusInput, dedInput, 'pending');
    setEditingId(null);
  };

  const handleProcessClick = (id: string) => {
    const record = payroll.find(p => p.id === id);
    if (!record) return;
    updatePayroll(id, record.bonus, record.deductions, 'processed');
  };

  const selectedRecord = payroll.find(p => p.id === selectedRecordId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Upper Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-6 bg-white flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-palette-1/50 uppercase tracking-wider">Total Payroll Budget</p>
            <p className="text-2xl font-black text-palette-1 mt-1.5">${totalPayroll.toLocaleString()}</p>
          </div>
          <div className="text-[10px] text-palette-2 font-bold mt-2">
            Base salaries + adjustments
          </div>
        </div>

        <div className="premium-card p-6 bg-white flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-palette-1/50 uppercase tracking-wider">Total Bonuses Paid</p>
            <p className="text-2xl font-black text-palette-4 mt-1.5">${totalBonuses.toLocaleString()}</p>
          </div>
          <div className="text-[10px] text-palette-4 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-palette-5" />
            Productivity allocations
          </div>
        </div>

        <div className="premium-card p-6 bg-white flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-palette-1/50 uppercase tracking-wider">Total Deductions</p>
            <p className="text-2xl font-black text-red-500 mt-1.5">${totalDeductions.toLocaleString()}</p>
          </div>
          <div className="text-[10px] text-red-500 font-bold mt-2">
            Tax co-pays, insurance & unpaid
          </div>
        </div>

        <div className="premium-card p-6 bg-white flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-palette-1/50 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-2xl font-black text-orange-500 mt-1.5">{pendingCount} Records</p>
          </div>
          <div className="text-[10px] text-orange-500 font-bold mt-2">
            Requires HR validation
          </div>
        </div>
      </div>

      {/* Main Grid: Spreadsheet & Payslip */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Spreadsheet (2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-palette-2/20 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 bg-palette-3/15">
            <div>
              <h3 className="font-extrabold text-palette-1 text-base">Salary Adjustment Matrix</h3>
              <p className="text-xs text-palette-2 mt-0.5">Edit bonuses and run simulated AI double-billing scanning checks.</p>
            </div>
            
            {pendingCount > 0 && (
              <button
                onClick={processAllPayroll}
                className="bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Process All Pending
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-palette-2/20 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-palette-3/30 text-palette-1/70 text-[10.5px] font-extrabold uppercase border-b border-palette-2/20">
                    <th className="py-4 px-6">Employee</th>
                    <th className="py-4 px-6">Base Salary</th>
                    <th className="py-4 px-6">Bonus</th>
                    <th className="py-4 px-6">Deductions</th>
                    <th className="py-4 px-6">Net Payout</th>
                    <th className="py-4 px-6">AI Audit Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-palette-2/10 text-xs font-semibold text-palette-1/80">
                  {payroll.map(p => {
                    const isEditing = editingId === p.id;
                    const netPayout = p.baseSalary + p.bonus - p.deductions;
                    const hasAnomalies = p.anomalies.length > 0;
                    
                    return (
                      <tr key={p.id} className="hover:bg-palette-3/10 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-bold text-sm text-palette-1">{p.employeeName}</p>
                            <p className="text-palette-2 mt-0.5">{p.month}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold">${p.baseSalary.toLocaleString()}</td>
                        
                        {/* Bonus */}
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-20 border border-palette-2/40 px-2 py-1 rounded text-xs"
                              value={bonusInput}
                              onChange={(e) => setBonusInput(parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="text-palette-4 font-bold">+${p.bonus.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Deductions */}
                        <td className="py-4 px-6">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-20 border border-palette-2/40 px-2 py-1 rounded text-xs"
                              value={dedInput}
                              onChange={(e) => setDedInput(parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="text-red-500 font-bold">-${p.deductions.toLocaleString()}</span>
                          )}
                        </td>

                        {/* Net */}
                        <td className="py-4 px-6 text-sm font-black text-palette-1">
                          ${netPayout.toLocaleString()}
                        </td>

                        {/* AI Audit */}
                        <td className="py-4 px-6">
                          {hasAnomalies ? (
                            <div className="flex items-center gap-1 text-red-500 animate-pulse cursor-help" title={p.anomalies.join('\n')}>
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span className="text-[10px] font-extrabold uppercase">Anomaly Flagged</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-green-500">
                              <Check className="w-4 h-4" />
                              <span className="text-[10px] font-extrabold uppercase">Passed Audit</span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveClick(p.id)}
                                className="p-1.5 bg-green-50 hover:bg-green-100 rounded text-green-600 transition-colors"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditClick(p)}
                                className="p-1.5 hover:bg-palette-3 rounded text-palette-2 hover:text-palette-1 transition-colors"
                                title="Adjust salary/bonus"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedRecordId(p.id)}
                              className="p-1.5 hover:bg-palette-3 rounded text-palette-2 hover:text-palette-4 transition-colors"
                              title="Generate Payslip"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {p.status === 'pending' && (
                              <button
                                onClick={() => handleProcessClick(p.id)}
                                className="bg-palette-4 hover:bg-palette-1 text-white text-[10px] px-2.5 py-1 rounded-md"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payslip Viewer (1 col) */}
        <div className="xl:col-span-1 space-y-6">
          {selectedRecord ? (
            <div className="premium-card p-6 bg-palette-3/30 border border-palette-2/20 space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Close button */}
              <button 
                onClick={() => setSelectedRecordId(null)}
                className="absolute right-4 top-4 p-1 hover:bg-palette-2/20 rounded-lg text-palette-2 hover:text-palette-1"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center border-b border-palette-2/20 pb-4">
                <h4 className="font-extrabold text-palette-1 text-lg">NEXHIRE CORPORATE INC.</h4>
                <p className="text-[10px] text-palette-2 font-bold uppercase tracking-wider">Salary Payslip Receipt</p>
              </div>

              {/* Pay slip metadata */}
              <div className="grid grid-cols-2 gap-y-2 text-[10.5px] font-semibold text-palette-1/70 border-b border-palette-2/10 pb-4">
                <div>EMPLOYEE NAME:</div>
                <div className="text-right text-palette-1 font-bold">{selectedRecord.employeeName}</div>
                <div>STATEMENT MONTH:</div>
                <div className="text-right text-palette-1">{selectedRecord.month}</div>
                <div>TRANSACTION REF:</div>
                <div className="text-right text-palette-1 font-mono uppercase">TXN-{selectedRecord.id}-{(Math.random() * 1000000).toFixed(0)}</div>
                <div>PAYOUT STATUS:</div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    selectedRecord.status === 'processed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                  }`}>
                    {selectedRecord.status}
                  </span>
                </div>
              </div>

              {/* Itemized list */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-palette-1">
                  <span>Base Remuneration:</span>
                  <span className="font-bold">${selectedRecord.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-palette-4">
                  <span>Performance Bonus:</span>
                  <span className="font-bold">+${selectedRecord.bonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span>Tax & Insurance Deductions:</span>
                  <span className="font-bold">-${selectedRecord.deductions.toLocaleString()}</span>
                </div>

                <div className="border-t border-palette-2/25 pt-3.5 flex justify-between items-center text-sm font-black text-palette-1">
                  <span>NET CORPORATE PAYOUT:</span>
                  <span>${(selectedRecord.baseSalary + selectedRecord.bonus - selectedRecord.deductions).toLocaleString()}</span>
                </div>
              </div>

              {/* Print Action */}
              <button 
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-1.5 bg-palette-1 hover:bg-palette-4 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Electronic Receipt
              </button>
            </div>
          ) : (
            <div className="premium-card p-8 text-center text-palette-2 text-xs flex flex-col justify-center items-center h-48 border-dashed border-2">
              <FileText className="w-10 h-10 text-palette-2/40 mb-3" />
              Click the file icon on an employee row to generate a high-fidelity digital payslip.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
