import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserManagementServices } from '@/services/UserManagementServices';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // Default role
  
  // Staff fields
  const [church, setChurch] = useState('');
  const [zonal, setZonal] = useState('');
  const [department, setDepartment] = useState('');
  const [professionalCertification, setProfessionalCertification] = useState('');
  const [grade, setGrade] = useState('');

  const [successData, setSuccessData] = useState<{message: string, tempPassword?: string} | null>(null);
  
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: UserManagementServices.createUser,
    onSuccess: (data) => {
      setSuccessData(data);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsersStats'] });
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ fullName, email, role, phone, dateOfBirth, gender, password, church, zonal, department, professionalCertification, grade });
  };

  const handleClose = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setDateOfBirth('');
    setGender('');
    setPassword('');
    setRole('admin');
    setChurch('');
    setZonal('');
    setDepartment('');
    setProfessionalCertification('');
    setGrade('');
    setSuccessData(null);
    mutation.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Add New User</h2>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        {successData ? (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">User Created Successfully</h3>
            <p className="text-sm text-slate-500 mb-4">{successData.message}</p>
            {successData.tempPassword && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 w-full text-left">
                <p className="text-xs font-bold text-slate-500 mb-1">Temporary Password</p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono font-black text-slate-800">{successData.tempPassword}</code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(successData.tempPassword!)}
                    className="text-xs font-bold text-[#16a34a] hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">The user must change this on first login.</p>
              </div>
            )}
            <button 
              onClick={handleClose}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden bg-slate-50">
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-xl border border-slate-200">
                
                {/* Left Column: Core Account Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#15803d] uppercase mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]"></span>
                    Account Details
                  </h4>
                  
                  <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                  placeholder="name@example.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                    placeholder="08012345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    required
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select 
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                    placeholder="Enter password"
                  />
                </div>
              </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                    <select 
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="zone_coordinator">Zonal Coordinator</option>
                      <option value="camp_logistics_coordinator">Camp Logistics Coordinator</option>
                      <option value="finance">Finance</option>
                      <option value="auditor">Auditor</option>
                      <option value="customer_service">Customer Service</option>
                    </select>
                  </div>
                </div>

                {/* Right Column: Staff Profile */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#15803d] uppercase mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]"></span>
                    Staff Profile Data
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Church / Parish</label>
                      <input 
                        type="text" 
                        value={church}
                        onChange={e => setChurch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                        placeholder="e.g. RCCG Main"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Zonal</label>
                      <input 
                        type="text" 
                        value={zonal}
                        onChange={e => setZonal(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                        placeholder="e.g. Zone 4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                      <input 
                        type="text" 
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                        placeholder="e.g. Logistics"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Prof. Certification</label>
                      <input 
                        type="text" 
                        value={professionalCertification}
                        onChange={e => setProfessionalCertification(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                        placeholder="e.g. ICAN (Optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Grade</label>
                    <input 
                      type="text" 
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                      placeholder="e.g. Level 2"
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
              {mutation.isError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
                  {(mutation.error as any)?.response?.data?.message || mutation.error.message || 'An error occurred'}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="bg-[#16a34a] text-white px-5 py-2 text-sm font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating...</> : 'Create User'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
