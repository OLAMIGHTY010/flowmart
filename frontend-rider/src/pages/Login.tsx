import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { RiderButton } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
import SideBanner from '@/components/SideBanner';
import logo from '@/assets/flowmart-logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    if (!user.isVerified) {
      return <Navigate to="/otp" replace />;
    }
    if (!user.profileCompleted) {
      return <Navigate to="/profile-setup" replace />;
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
      if (result.error && result.error.toLowerCase().includes('verify your email')) {
        navigate('/otp', { state: { email } });
        return;
      }
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      {/* Main Login Panel */}
      <div className="flex-grow flex flex-col p-6 lg:p-12 relative">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition absolute top-6 left-6 lg:top-12 lg:left-12 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
        <div className="flex-grow flex items-center justify-center max-w-lg mx-auto w-full">
          <div className="w-full flex flex-col gap-6">
            {/* Logo / Title Area */}
            <div className="text-center lg:text-left mt-8 lg:mt-0">
              <div className="flex items-center gap-2 h-16 lg:h-20 mb-3 justify-center w-fit-content">
                <img src={logo} alt="FlowMart Logo" className="h-40 lg:h-60 object-contain" />
              </div>
              <h2 className="text-3xl font-bold font-headings text-foreground leading-tight">
                Welcome back
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Login to access your vendor dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium text-center flex flex-col gap-2 items-center">
                  <span>{error}</span>
                  {(error.toLowerCase().includes("credentials") || error.toLowerCase().includes("password")) && (
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer bg-transparent border-none p-0 outline-none"
                    >
                      Forgot your password? Reset it here.
                    </button>
                  )}
                </div>
              )}

              <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-4">
                <VendorInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="Enter you email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="relative w-full">
                  <VendorInput
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-[44px] text-muted-foreground hover:text-foreground transition cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs font-bold text-primary hover:underline transition-all cursor-pointer bg-transparent border-none p-0 outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <RiderButton type="submit" disabled={isFormEmpty || loading} className="mt-2">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
                {loading ? 'Signing in...' : 'Login'}
              </RiderButton>

              <p className="text-sm text-muted-foreground text-center">
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none outline-none font-body"
                >
                  Sign up
                </button>
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
