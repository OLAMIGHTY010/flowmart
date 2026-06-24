import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { riderService } from '@/services/RiderServices';
import { useAuth } from '@/hooks/useAuth';
import { useProfileSetupFormCache } from '@/hooks/useKYCFormCache';
import { RiderButton } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
import OnboardingStepIndicator from '@/components/OnboardingStepIndicator';
import Icon from '@/components/Icon';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SideBanner from '@/components/SideBanner';

interface ProfileSetupProps {
  onNext?: () => void;
}

export default function ProfileSetup({ onNext }: ProfileSetupProps) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Form states - dynamically pre-populate from local cache (or empty string)
  const { formData, updateForm } = useProfileSetupFormCache();
  
  const [phone, setPhone] = useState(formData.phone || user?.phone || '');
  const [stateRegion, setStateRegion] = useState(formData.stateRegion || '');
  const [city, setCity] = useState(formData.city || '');
  const [bio, setBio] = useState(formData.bio || '');
  
  const [dob, setDob] = useState(formData.dob || user?.dateOfBirth || '');
  const [gender, setGender] = useState(formData.gender || user?.gender || '');
  
  React.useEffect(() => {
    updateForm({ phone, stateRegion, city, bio, avatar: profileImage || '', dob, gender });
  }, [phone, stateRegion, city, bio, profileImage, dob, gender]);

  // Read-only personal info from registration
  // Read-only personal info from registration
  const fullName = user?.fullName || '';

  const formatDob = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setShowErrors(true);

    if (!phone || !stateRegion || !city) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      await riderService.updateProfile({
        displayName: fullName,
        phone,
        stateRegion,
        city,
        bio,
        avatar: profileImage || undefined
      });
      await refreshUser();
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        if (onNext) {
          onNext();
        } else {
          navigate('/kyc');
        }
      }, 500);
    } catch (err) {
      setErrorMsg('Failed to update profile. Please try again.');
    }
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
          <OnboardingStepIndicator currentStep={3} />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center hover:bg-border/60 transition-colors cursor-pointer"
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
          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Section: Verified Personal Info (Read-only) */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-[#16a34a] rounded-md flex items-center justify-center">
                  <Icon i="user" size={13} className="text-white" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Personal Information
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 pb-2">
                <div className="flex flex-col items-center gap-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 bg-muted rounded-full cursor-pointer group border-2 border-background shadow-inner flex items-center justify-center overflow-hidden transition-all hover:ring-4 hover:ring-primary/20"
                  >
                    {profileImage ? (
                      <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground flex items-center justify-center">
                        <Icon i="user" size={32} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full border-2 border-surface flex items-center justify-center shadow-md">
                      <Icon i="camera" size={10} className="text-primary-foreground" />
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
                    className="text-[10px] font-semibold text-primary hover:underline transition-all cursor-pointer"
                  >
                    Upload Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <div className="flex items-center gap-2 bg-[#f9fafb] border border-border/60 rounded-xl px-3.5 py-3">
                    <Icon i="user" size={14} className="text-[#16a34a] flex-shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">{fullName}</span>
                    <Icon i="check-circle" size={14} className="text-[#16a34a] ml-auto flex-shrink-0" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date of Birth</label>
                  <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3.5 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <Icon i="calendar" size={14} className="text-muted-foreground flex-shrink-0" />
                    <input 
                      type="date" 
                      value={dob} 
                      onChange={(e) => setDob(e.target.value)} 
                      className="w-full bg-transparent border-none outline-none text-sm font-semibold text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gender</label>
                  <Select value={gender} onValueChange={setGender} required>
                    <SelectTrigger className="w-full bg-input border-border rounded-xl px-3.5 h-[46px] focus:ring-primary/20">
                      <div className="flex items-center gap-2">
                        <Icon i="users" size={14} className="text-muted-foreground flex-shrink-0" />
                        <SelectValue placeholder="Select Gender" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Business Information */}
          <Card className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="briefcase" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Business Information
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <VendorInput
                  label="Phone Number"
                  placeholder="08012345678"
                  icon="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  isError={showErrors && !phone}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <VendorInput
                  label="State / Region"
                  placeholder="Select state"
                  icon="map-pin"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  required
                />

                <VendorInput
                  label="City"
                  placeholder="Enter city"
                  icon="building"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground" htmlFor="bio">
                  About Business
                </label>
                <textarea
                  id="bio"
                  placeholder="Describe your business and services..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <RiderButton type="submit" className="mt-2">
            Save & Continue
          </RiderButton>
        </form>
      </div>
    </div>
  );
}