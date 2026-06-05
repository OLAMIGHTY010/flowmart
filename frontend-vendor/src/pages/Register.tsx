import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import VendorButton from '@/components/VendorButton';
import VendorInput from '@/components/VendorInput';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (!termsAccepted) {
      setValidationError('You must accept the Terms and Conditions to proceed');
      return;
    }

    console.log('Account Created Successfully:', formData);
    navigate('/profile-setup'); // Redirect to Step 2: Profile Setup
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      {/* Side Banner: RCCG Holy Ghost Conference 2025 */}
      <div className="relative hidden lg:flex lg:w-2/5 xl:w-1/3 bg-dark-header text-white p-8 flex-col justify-between overflow-hidden">
        {/* Background Decorative Overlay */}
        <div className="absolute inset-0 opacity-25 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200"
            alt="Worship scene background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">
            🌿
          </div>
          <span className="text-lg font-bold tracking-tight text-white">FlowMart Portal</span>
        </div>

        {/* Event Center Display */}
        <div className="relative z-10 my-auto py-12 flex flex-col gap-4">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-primary bg-secondary/90 w-fit">
            Partner Event 2025
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            RCCG Holy Ghost Congress 2025
          </h1>
          <p className="text-sm text-white/80 leading-relaxed font-light">
            Theme: <strong className="font-bold text-white">"The God of All Flesh"</strong>
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            December 8 – 14, 2025 • Redemption City, Nigeria
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-white/50">
          © 2026 FlowMart. All rights reserved.
        </div>
      </div>

      {/* Main Registration Panel */}
      <div className="flex-1 p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Progress Bar (Desktop native, step 0: Account) */}
        <div className="mb-8 border-b border-border/80 pb-4">
          <VendorProgressBar
            steps={['Account', 'Profile', 'KYC', 'Store']}
            current={0}
          />
        </div>

        {/* Header Title with Back button pointing strictly to Login */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center hover:bg-border/60 transition-colors cursor-pointer"
              aria-label="Go to login"
            >
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-2xl font-bold font-headings text-foreground leading-tight">
                Create Account
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Register as a vendor to start selling
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {validationError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {validationError}
            </div>
          )}

          <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VendorInput
                label="First Name"
                name="firstName"
                type="text"
                placeholder="Martha"
                value={formData.firstName}
                onChange={handleChange}
                required
              />

              <VendorInput
                label="Last Name"
                name="lastName"
                type="text"
                placeholder="Johnson"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email & Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VendorInput
                label="Email Address"
                name="email"
                type="email"
                placeholder="martha@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <VendorInput
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                placeholder="+234 800 000 0000"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative w-full">
                <VendorInput
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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

              <div className="relative w-full">
                <VendorInput
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-[44px] text-muted-foreground hover:text-foreground transition cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div
              onClick={() => setTermsAccepted(!termsAccepted)}
              className="flex items-start gap-3 mt-2 cursor-pointer select-none"
            >
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  termsAccepted
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-input'
                }`}
              >
                {termsAccepted && <Icon i="check" size={12} />}
              </div>
              <span className="text-xs text-muted-foreground leading-relaxed font-medium">
                I agree to the{' '}
                <a
                  href="/terms"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary font-bold hover:underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary font-bold hover:underline"
                >
                  Privacy Policy
                </a>
              </span>
            </div>
          </div>

          <VendorButton type="submit" className="mt-2" disabled={!termsAccepted}>
            Create Account
          </VendorButton>

          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none outline-none font-body"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}