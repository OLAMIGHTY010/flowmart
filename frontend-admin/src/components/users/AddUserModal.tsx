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
  const [role, setRole] = useState('admin'); // Default role
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
    mutation.mutate({ fullName, email, role });
  };

  const handleClose = () => {
    setFullName('');
    setEmail('');
    setRole('admin');
    setSuccessData(null);
    mutation.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
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
          <form onSubmit={handleSubmit} className="p-5">
            <div className="space-y-4">
              
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="zone_coordinator">Zonal Coordinator</option>
                  <option value="camp_logistics_coordinator">Camp Logistics Coordinator</option>
                </select>
              </div>

            </div>

            {mutation.isError && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
                {(mutation.error as any)?.response?.data?.message || mutation.error.message || 'An error occurred'}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
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
          </form>
        )}
      </div>
    </div>
  );
}
