import React, { useState } from 'react';
import { useHR, type Employee } from '../context/HRContext';
import { 
  Search, 
  UserPlus, 
  Grid, 
  List, 
  Star, 
  Mail, 
  Briefcase, 
  Calendar,
  X,
  Trash2,
  Edit2,
  Check
} from 'lucide-react';

export const Employees: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useHR();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Employee Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [role, setRole] = useState('');
  const [performanceRating, setPerformanceRating] = useState(4.0);

  // Edit Employee State
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(4.0);
  const [editStatus, setEditStatus] = useState<Employee['status']>('active');

  const departments = ['All', 'Engineering', 'Design', 'Product', 'People & Culture', 'Executive'];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                          emp.role.toLowerCase().includes(search.toLowerCase()) ||
                          emp.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) return;
    addEmployee({
      name,
      email,
      department,
      role,
      status: 'active',
      performanceRating
    });
    // Reset form
    setName('');
    setEmail('');
    setRole('');
    setDepartment('Engineering');
    setPerformanceRating(4.0);
    setShowAddModal(false);
  };

  const handleSaveEdit = (id: string) => {
    updateEmployee(id, {
      performanceRating: editRating,
      status: editStatus
    });
    setEditingEmpId(null);
  };

  const startEditing = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEditRating(emp.performanceRating);
    setEditStatus(emp.status);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white p-4 rounded-2xl border border-palette-2/20 shadow-sm">
        {/* Left: Search & Filter */}
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, role, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-palette-3/30 border border-palette-2/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-4 focus:bg-white text-sm"
            />
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-palette-2" />
          </div>
          
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-palette-3/30 border border-palette-2/30 rounded-xl text-sm font-semibold text-palette-1/80 outline-none focus:ring-2 focus:ring-palette-4"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Right: Layout Toggle & Add Button */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-palette-3/50 p-1 rounded-xl border border-palette-2/20">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-palette-4 shadow-sm' : 'text-palette-2 hover:text-palette-1'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-palette-4 shadow-sm' : 'text-palette-2 hover:text-palette-1'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-palette-4 hover:bg-palette-1 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all duration-300 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEmployees.map(emp => (
            <div key={emp.id} className="premium-card p-6 flex flex-col justify-between relative overflow-hidden group">
              {/* Card Actions */}
              <div className="absolute right-4 top-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => startEditing(emp)}
                  className="p-1.5 bg-palette-3 hover:bg-palette-2 rounded-lg text-palette-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => deleteEmployee(emp.id)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                {/* Avatar and Name */}
                <div className="flex items-center gap-4">
                  <img 
                    src={emp.avatar} 
                    alt={emp.name} 
                    className="w-14 h-14 rounded-full border-2 border-palette-2/40 object-cover shadow-sm" 
                  />
                  <div>
                    <h4 className="font-extrabold text-palette-1 text-base">{emp.name}</h4>
                    <p className="text-xs text-palette-4 font-bold uppercase tracking-wider">{emp.role}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-6 space-y-2.5 text-xs text-palette-1/80 border-t border-palette-2/10 pt-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-palette-2" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-palette-2" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-palette-2" />
                    <span>Joined: {emp.joinDate}</span>
                  </div>
                </div>
              </div>

              {/* Status and Rating */}
              <div className="mt-6 pt-4 border-t border-palette-2/10 flex justify-between items-center">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                  emp.status === 'active' 
                    ? 'bg-green-500/10 text-green-500' 
                    : emp.status === 'suspended'
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {emp.status}
                </span>

                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-palette-5 text-palette-5" />
                  <span className="text-xs font-bold text-palette-1">{emp.performanceRating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View (Table) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-palette-2/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-palette-3/50 text-palette-1/70 text-xs font-extrabold uppercase border-b border-palette-2/20">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Role & Dept</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Performance</th>
                  <th className="py-4 px-6">Join Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-palette-2/10 text-sm text-palette-1/80">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-palette-3/10 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          className="w-10 h-10 rounded-full border border-palette-2/30 object-cover" 
                        />
                        <div>
                          <p className="font-bold text-palette-1">{emp.name}</p>
                          <p className="text-xs text-palette-2">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="py-4 px-6">
                      <p className="font-semibold text-palette-1">{emp.role}</p>
                      <p className="text-xs text-palette-2">{emp.department}</p>
                    </td>

                    {/* Status (Editable if inline) */}
                    <td className="py-4 px-6">
                      {editingEmpId === emp.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as Employee['status'])}
                          className="text-xs font-bold bg-white border border-palette-2/40 px-2 py-1 rounded-lg outline-none"
                        >
                          <option value="active">active</option>
                          <option value="suspended">suspended</option>
                          <option value="terminated">terminated</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                          emp.status === 'active' 
                            ? 'bg-green-500/10 text-green-500' 
                            : emp.status === 'suspended'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {emp.status}
                        </span>
                      )}
                    </td>

                    {/* Rating (Editable if inline) */}
                    <td className="py-4 px-6">
                      {editingEmpId === emp.id ? (
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          value={editRating}
                          onChange={(e) => setEditRating(parseFloat(e.target.value))}
                          className="w-16 text-xs font-bold border border-palette-2/40 px-2 py-1 rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-palette-5 text-palette-5" />
                          <span className="font-bold">{emp.performanceRating.toFixed(1)}</span>
                        </div>
                      )}
                    </td>

                    {/* Join Date */}
                    <td className="py-4 px-6 text-xs font-semibold text-palette-2">
                      {emp.joinDate}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingEmpId === emp.id ? (
                          <button
                            onClick={() => handleSaveEdit(emp.id)}
                            className="p-1.5 bg-green-50 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditing(emp)}
                            className="p-1.5 hover:bg-palette-3 rounded-lg text-palette-2 hover:text-palette-1 transition-colors"
                            title="Edit employee"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteEmployee(emp.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-palette-2 hover:text-red-500 transition-colors"
                          title="Delete profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-palette-1/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-palette-2/20 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-palette-2/15 flex justify-between items-center bg-palette-3/30">
              <h3 className="font-extrabold text-lg text-palette-1 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-palette-4" />
                Add New Employee
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-palette-2 hover:text-palette-1 p-1 hover:bg-palette-2/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Green"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. r.green@enterprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                  >
                    {departments.filter(d => d !== 'All').map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Initial Performance</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={performanceRating}
                    onChange={(e) => setPerformanceRating(parseFloat(e.target.value))}
                    className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-1.5">Job Title / Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-palette-4"
                />
              </div>

              <div className="pt-4 border-t border-palette-2/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-palette-2/40 text-palette-1 hover:bg-palette-3/50 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-palette-4 hover:bg-palette-1 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
