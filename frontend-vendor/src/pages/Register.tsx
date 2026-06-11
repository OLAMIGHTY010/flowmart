import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { VendorButton } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';
import SideBanner from '@/components/SideBanner';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
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
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
    const result = await register({
      fullName,
      email: formData.email,
      password: formData.password,
      role: 'vendor',
    });
    setLoading(false);

    if (result.success) {
      navigate('/profile-setup'); // Redirect to Step 2: Profile Setup
    } else {
      setValidationError(result.error || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

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

          <VendorButton type="submit" className="mt-2" disabled={!termsAccepted || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
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