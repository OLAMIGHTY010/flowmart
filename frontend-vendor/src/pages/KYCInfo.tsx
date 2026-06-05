import { useState } from 'react';
import { useNavigate } from 'react-router';
import VendorButton from '@/components/VendorButton';
import VendorInput from '@/components/VendorInput';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';

export default function KYCInfo() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('Chukwuemeka Adaeze');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [bvn, setBvn] = useState('');

  const [businessName, setBusinessName] = useState('Chukwu Ventures Ltd');
  const [cacNo, setCacNo] = useState('');
  const [tin, setTin] = useState('');

  const [bankName, setBankName] = useState('First Bank Nigeria');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState('Chukwuemeka Adaeze');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate('/kyc/review'); // Redirect to review step
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
          <span className="text-sm font-semibold">KYC Information Saved!</span>
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
            current={2}
          />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center hover:bg-border/60 transition-colors"
              aria-label="Go back"
            >
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-2xl font-bold font-headings text-foreground leading-tight">
                KYC Information
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Business identity & banking details
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-8">
          {/* Section: Personal Info */}
          <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <Icon i="user" size={13} className="text-primary-foreground" />
              </div>
              <span className="text-base font-bold text-foreground">
                Personal Information
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VendorInput
                label="Full Legal Name"
                placeholder="As on government ID"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <VendorInput
                label="Date of Birth"
                placeholder="DD / MM / YYYY"
                icon="calendar"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground">Gender</span>
                <div className="flex gap-3">
                  {['Male', 'Female', 'Other'].map((g) => {
                    const isSelected = gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-3 rounded-xl border text-center text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-secondary text-primary'
                            : 'border-border bg-input text-muted-foreground hover:bg-border/50'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <VendorInput
                label="BVN (Bank Verification No.)"
                placeholder="11-digit BVN"
                icon="credit-card"
                value={bvn}
                onChange={(e) => setBvn(e.target.value)}
                maxLength={11}
                required
              />
            </div>
          </div>

          {/* Section: Business Info */}
          <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <Icon i="briefcase" size={13} className="text-primary-foreground" />
              </div>
              <span className="text-base font-bold text-foreground">
                Business Information
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <VendorInput
                  label="Business Name"
                  placeholder="Registered business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-1">
                <VendorInput
                  label="CAC Registration No."
                  placeholder="RC000000"
                  icon="hash"
                  value={cacNo}
                  onChange={(e) => setCacNo(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-1">
                <VendorInput
                  label="Tax Identification No. (TIN)"
                  placeholder="Enter TIN"
                  icon="file-text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Bank Details */}
          <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <Icon i="landmark" size={13} className="text-primary-foreground" />
              </div>
              <span className="text-base font-bold text-foreground">
                Bank Account Details
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VendorInput
                label="Bank Name"
                placeholder="Select bank"
                icon="chevron-down"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />

              <VendorInput
                label="Account Number"
                placeholder="10-digit account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                maxLength={10}
                required
              />

              <VendorInput
                label="Account Name"
                placeholder="Account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
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
