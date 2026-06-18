import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '@/services/AuthServices';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router';

export default function ForcePasswordChange() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const changeMutation = useMutation({
    mutationFn: () => authService.forceChangePassword(newPassword),
    onSuccess: async () => {
      showToast('Password updated successfully', 'success');
      await refreshUser(); // This clears the forcePasswordChange flag
      if (user?.role === 'camp_logistics_coordinator' || user?.role === 'zone_coordinator') {
        navigate('/coordinator-analytics');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to change password';
      showToast(msg, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    changeMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#14532d] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]"></div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Action Required</h1>
          <p className="text-sm text-green-100 mt-2 font-medium">Please update your temporary password to continue.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <p className="text-sm text-slate-600">
              Welcome back, <strong className="text-slate-800">{user?.fullName}</strong>. For security reasons, administrative accounts must set a new password upon first login.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">New Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-success focus:ring-1 focus:ring-success bg-slate-50 focus:bg-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 focus:outline-none focus:border-success focus:ring-1 focus:ring-success bg-slate-50 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={changeMutation.isPending}
            className="w-full mt-8 bg-success hover:bg-green-600 text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {changeMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Updating...
              </>
            ) : (
              'Save & Continue to Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
