import React, { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/AuthServices';
import logo from '@/assets/flowmart.png';
import { Shield, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();

  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Reset Password State
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    if (!user.isVerified) {
      return <Navigate to="/otp" replace />;
    }
    // Admins and coordinators do not require profile setup routing
    if (user.role === 'camp_logistics_coordinator' || user.role === 'zone_coordinator') {
      return <Navigate to="/coordinator-analytics" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const isFormEmpty = email.trim() === '' || password.trim() === '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your email to receive the reset code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setLoading(false);
      const data = res.data || res;
      if (data && (data.success || data.message)) {
        setSuccessMsg(data.message || 'Reset code sent to your email.');
        setMode('reset');
      } else {
        setError(data.message || 'Failed to send reset code.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || 'Failed to send reset code.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!resetCode.trim() || !newPassword.trim()) {
      setError('Please enter the 6-digit code and your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({ email, otp: resetCode, newPassword });
      setLoading(false);
      const data = res.data || res;
      if (data && data.success) {
        setSuccessMsg('Password reset successfully! You can now sign in.');
        setMode('login');
        setPassword('');
        setResetCode('');
        setNewPassword('');
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f341c] flex flex-col items-center justify-center p-4 font-body relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#164a28] opacity-20 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#164a28] opacity-30 blur-[100px]"></div>
      </div>

      {/* Top Header Section */}
      <div className="flex flex-col items-center mb-10 z-10">
        <div className="flex items-center justify-center mb-6">
          <img src={logo} alt="FlowMart Logo" className="h-10 object-contain" />
        </div>
        
        <div className="px-5 py-2 rounded-full bg-[#132c1c] border border-[#1b3d27] text-[#93a89a] text-[10px] font-bold tracking-[0.2em] uppercase mb-5 flex items-center gap-2.5 shadow-inner">
          <Shield />
          FLOWMART Admin PORTAL
        </div>
        
        <p className="text-[#648b71] text-xs font-medium tracking-wide">
          Authorized access only — platform-level control
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-[#effaf2] rounded-[24px] w-full max-w-[420px] p-8 sm:p-10 shadow-2xl z-10 relative">
        
        {/* Inner Card Logo */}
        {/* <div className="flex items-center justify-center mb-8">
          <img src={logo} alt="FlowMart Logo" className="h-8 object-contain" />
        </div> */}

        <h2 className="text-[#0f341c] text-lg font-bold text-center mb-8">
          {mode === 'login' && 'Sign in to your account'}
          {mode === 'forgot' && 'Reset your password'}
          {mode === 'reset' && 'Create new password'}
        </h2>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl font-semibold text-center border border-red-100">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-[#e4f4ea] text-[#0ca948] text-xs px-4 py-3 rounded-xl font-semibold text-center border border-[#cce8d6]">
                {successMsg}
              </div>
            )}

          {/* Email Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#0f341c]">Email Address</label>
            <div className="flex items-center bg-[#e4f4ea] border border-[#cce8d6] rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#0ca948]/20 focus-within:border-[#0ca948] transition-all group">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent w-full outline-none text-sm font-semibold text-[#0f341c] placeholder:text-[#8eb89f] placeholder:font-medium"
                placeholder="admin@flowmart.com"
                required
              />
              <svg className="text-[#8eb89f] group-focus-within:text-[#0ca948] transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#0f341c]">Password</label>
            <div className="flex items-center bg-[#e4f4ea] border border-[#cce8d6] rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#0ca948]/20 focus-within:border-[#0ca948] transition-all group">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent w-full outline-none text-sm font-semibold text-[#0f341c] placeholder:text-[#8eb89f] placeholder:font-medium tracking-wide"
                placeholder="Enter your password"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#8eb89f] hover:text-[#0f341c] focus:outline-none transition-colors group-focus-within:text-[#0ca948]"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-1.5 mb-1">
            <button 
              type="button" 
              onClick={() => {
                setMode('forgot');
                setError('');
                setSuccessMsg('');
              }}
              className="text-[#0ca948] text-xs font-bold hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isFormEmpty || loading}
            className="w-full py-3.5 mt-2 bg-[#0ca948] hover:bg-[#0a8c3c] text-white rounded-xl text-sm font-bold shadow-[0_4px_20px_0_rgba(12,169,72,0.35)] transition-all flex justify-center items-center active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : null}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-[10px] font-bold text-[#0ca948] mt-3 opacity-90 tracking-wide">
            © 2024 FlowMart. All rights reserved.
          </p>
        </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl font-semibold text-center border border-red-100">
                {error}
              </div>
            )}
            
            <p className="text-xs text-[#0f341c] font-medium text-center mb-2">
              Enter your email address and we'll send you a 6-digit code to reset your password.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0f341c]">Email Address</label>
              <div className="flex items-center bg-[#e4f4ea] border border-[#cce8d6] rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#0ca948]/20 focus-within:border-[#0ca948] transition-all group">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent w-full outline-none text-sm font-semibold text-[#0f341c] placeholder:text-[#8eb89f] placeholder:font-medium"
                  placeholder="admin@flowmart.com"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!email.trim() || loading}
              className="w-full py-3.5 mt-2 bg-[#0ca948] hover:bg-[#0a8c3c] text-white rounded-xl text-sm font-bold shadow-[0_4px_20px_0_rgba(12,169,72,0.35)] transition-all flex justify-center items-center active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending code...' : 'Send Reset Code'}
            </button>

            <button 
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 text-[#0ca948] text-sm font-bold hover:bg-[#e4f4ea] rounded-xl transition-colors"
            >
              <ArrowLeft size={16} /> Back to login
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl font-semibold text-center border border-red-100">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-[#e4f4ea] text-[#0ca948] text-xs px-4 py-3 rounded-xl font-semibold text-center border border-[#cce8d6]">
                {successMsg}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0f341c]">6-Digit Code</label>
              <div className="flex items-center bg-[#e4f4ea] border border-[#cce8d6] rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#0ca948]/20 focus-within:border-[#0ca948] transition-all group">
                <input 
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="bg-transparent w-full outline-none text-center text-xl tracking-[0.5em] font-black text-[#0f341c] placeholder:text-[#8eb89f] placeholder:font-medium placeholder:tracking-normal placeholder:text-sm"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0f341c]">New Password</label>
              <div className="flex items-center bg-[#e4f4ea] border border-[#cce8d6] rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#0ca948]/20 focus-within:border-[#0ca948] transition-all group">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-transparent w-full outline-none text-sm font-semibold text-[#0f341c] placeholder:text-[#8eb89f] placeholder:font-medium tracking-wide"
                  placeholder="Enter new password"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#8eb89f] hover:text-[#0f341c] focus:outline-none transition-colors group-focus-within:text-[#0ca948]"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!resetCode.trim() || !newPassword.trim() || loading}
              className="w-full py-3.5 mt-2 bg-[#0ca948] hover:bg-[#0a8c3c] text-white rounded-xl text-sm font-bold shadow-[0_4px_20px_0_rgba(12,169,72,0.35)] transition-all flex justify-center items-center active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button 
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 text-[#0ca948] text-sm font-bold hover:bg-[#e4f4ea] rounded-xl transition-colors"
            >
              <ArrowLeft size={16} /> Cancel
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
