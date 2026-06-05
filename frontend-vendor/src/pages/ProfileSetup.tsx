import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import VendorButton from '@/components/VendorButton';
import VendorInput from '@/components/VendorInput';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';

interface ProfileSetupProps {
  onNext?: () => void;
}

export default function ProfileSetup({ onNext }: ProfileSetupProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('Chukwuemeka Vendor');
  const [businessPhone, setBusinessPhone] = useState('+234 803 456 7890');
  const [stateRegion, setStateRegion] = useState('Lagos');
  const [city, setCity] = useState('Ikeja');
  const [bio, setBio] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      if (onNext) {
        onNext();
      } else {
        navigate('/kyc');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
            <Icon i="check" size={12} />
          </div>
          <span className="text-sm font-semibold">Profile Settings Saved!</span>
        </div>
      )}

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

      {/* Main Form Content Panel */}
      <div className="flex-1 p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Progress Bar (Desktop native, no status bar) */}
        <div className="mb-8 border-b border-border/80 pb-4">
          <VendorProgressBar
            steps={['Account', 'Profile', 'KYC', 'Store']}
            current={1}
          />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center hover:bg-border/60 transition-colors"
              aria-label="Go back"
            >
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-2xl font-bold font-headings text-foreground leading-tight">
                Your Profile
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tell us a bit about yourself to set up your store
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Avatar Upload */}
          <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col items-center justify-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 bg-muted rounded-full cursor-pointer group border-2 border-background shadow-inner flex items-center justify-center overflow-hidden transition-all hover:ring-4 hover:ring-primary/20"
            >
              {profileImage ? (
                <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-muted-foreground flex items-center justify-center">
                  <Icon i="user" size={40} className="text-muted-foreground" />
                </div>
              )}
              {/* Camera overlay */}
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full border-2 border-surface flex items-center justify-center shadow-md">
                <Icon i="camera" size={14} className="text-primary-foreground" />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-primary hover:underline transition-all"
            >
              Tap to upload profile photo
            </button>
          </div>

          {/* Form Fields Section */}
          <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VendorInput
                label="Display Name"
                placeholder="How you appear to customers"
                icon="user"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <VendorInput
                label="Business Phone"
                placeholder="+234 800 000 0000"
                icon="phone"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VendorInput
                label="State / Region"
                placeholder="Select your state"
                icon="map-pin"
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                required
              />

              <VendorInput
                label="City"
                placeholder="Enter your city"
                icon="building"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                placeholder="Short description about your business..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </div>

          <VendorButton type="submit" className="mt-2">
            Save & Continue
          </VendorButton>
        </form>
      </div>
    </div>
  );
}