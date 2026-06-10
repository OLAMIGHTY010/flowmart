import React, { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { ArrowLeft, Camera, Phone, Mail, Calendar, Home, Package, DollarSign, User } from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';
import { VendorButton } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
// import SideBanner from '@/components/SideBanner';

export default function Register() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, user } = useAuth(); // Assuming matching hook structure

  // Form Field States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const isFormEmpty = 
    firstName.trim() === '' || 
    lastName.trim() === '' || 
    phoneNumber.trim() === '' || 
    email.trim() === '' || 
    dob.trim() === '';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isFormEmpty) {
      setError('Please fill out all required personal information fields');
      return;
    }

    setLoading(true);
    // Mimicking your auth flow pattern
    const result = await register({ firstName, lastName, phoneNumber, email, dob, gender, profileImage });
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-center items-center py-8">
      {/* Mobile Frame Container Mockup */}
      <div className="w-full max-w-[412px] h-[900px] bg-background border border-border/80 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar">
        
        <div>
          {/* Header Area */}
          <div className="relative flex items-center px-6 pt-6 pb-3">
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="text-primary hover:opacity-80 transition cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 font-bold text-xl text-foreground">
              Create Account
            </h1>
          </div>

          {/* Progress Pill Indicator */}
          <div className="flex items-center gap-1.5 px-6 mb-3">
            <div className="w-6 h-1.5 rounded-full bg-primary"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-muted"></div>
            <span className="text-xs font-semibold text-primary ml-1 font-body">Personal Info</span>
          </div>

          {/* Context Subtitle */}
          <p className="text-sm text-muted-foreground px-6 mb-4">
            Let's get you started as a FlowMart rider
          </p>

          {/* Registration Form Card */}
          <form onSubmit={handleRegister} className="mx-4 p-5 border border-border/70 rounded-2xl bg-surface flex flex-col gap-4 shadow-2xs">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2.5 rounded-xl font-medium text-center">
                {error}
              </div>
            )}

            {/* Profile Avatar Uploader Component */}
            <div className="flex flex-col items-center mb-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-muted/40 border-2 border-dashed border-primary flex items-center justify-center relative cursor-pointer overflow-hidden group"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute top-[20%] w-8 h-8 rounded-full bg-muted-foreground/30"></div>
                    <div className="absolute bottom-0 w-[54px] h-[30px] rounded-t-[27px] bg-muted-foreground/30"></div>
                  </>
                )}
                <div className="absolute z-10 bg-surface/90 p-1.5 rounded-md text-primary shadow-xs group-hover:scale-105 transition">
                  <Camera size={14} />
                </div>
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs font-bold text-primary cursor-pointer hover:underline bg-transparent border-none outline-none"
              >
                Upload Photo
              </button>
            </div>

            {/* First Name & Last Name split-row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <VendorInput 
                  label="First Name"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <VendorInput 
                  label="Last Name"
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="relative w-full">
              <VendorInput 
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="pl-[84px]" // Extra padding to accommodate custom prefix offset
              />
              <Phone size={16} className="absolute left-3.5 top-[44px] text-muted-foreground" />
              <span className="absolute left-10 top-[42px] text-sm font-medium text-foreground">+234</span>
            </div>

            {/* Email Address Input */}
            <div className="relative w-full">
              <VendorInput 
                label="Email Address"
                name="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
              <Mail size={16} className="absolute left-3.5 top-[44px] text-muted-foreground" />
            </div>

            {/* Date of Birth Input */}
            <div className="relative w-full">
              <VendorInput 
                label="Date of Birth"
                name="dob"
                type="text"
                placeholder="DD/MM/YYYY"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="pl-10"
              />
              <Calendar size={16} className="absolute left-3.5 top-[44px] text-muted-foreground" />
            </div>

            {/* Gender Select Options */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Gender</label>
              <div className="relative">
                <select 
                  name="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3.5 pr-10 border border-border/70 rounded-xl text-sm text-foreground bg-surface outline-none appearance-none cursor-pointer focus:border-primary transition"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">
                  ▼
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Action Commit Area */}
        <div className="mt-auto">
          <div className="p-4 pt-6 text-center">
            <VendorButton 
              type="submit" 
              onClick={handleRegister}
              disabled={isFormEmpty || loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Continue'}
            </VendorButton>
            
            <p className="text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none outline-none font-body"
              >
                Sign In
              </button>
            </p>
          </div>

          {/* Mock Persistent Application Navigation Footer Bar */}
          <nav className="border-t border-border/70 flex justify-around py-2.5 bg-surface">
            <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-medium text-primary flex-1 bg-transparent border-none">
              <Home size={18} />
              <span>Home</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none">
              <Package size={18} />
              <span>Deliveries</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none">
              <DollarSign size={18} />
              <span>Earnings</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none">
              <User size={18} />
              <span>Profile</span>
            </button>
          </nav>
        </div>

      </div>
    </div>
  );
}