import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import VendorButton from '@/components/VendorButton';
import VendorInput from '@/components/VendorInput';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';
import { Card, CardContent } from '@/components/ui/card';
import SideBanner from '@/components/SideBanner';

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

      <SideBanner />

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
          <Card className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col items-center justify-center gap-3">
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
            </CardContent>
          </Card>

          {/* Form Fields Section */}
          <Card className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-5">
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
            </CardContent>
          </Card>

          <VendorButton type="submit" className="mt-2">
            Save & Continue
          </VendorButton>
        </form>
      </div>
    </div>
  );
}