import { useState } from 'react';
import { useNavigate } from 'react-router';
import { VendorButton, Button } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';
import { Card, CardContent } from '@/components/ui/card';
import SideBanner from '@/components/SideBanner';

const NIGERIAN_BANKS = [
  'Access Bank',
  'Zenith Bank',
  'Guaranty Trust Bank (GTBank)',
  'United Bank for Africa (UBA)',
  'First Bank of Nigeria (FirstBank)',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'Union Bank of Nigeria',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'Wema Bank',
  'Keystone Bank',
  'Polaris Bank',
  'Unity Bank',
  'Providus Bank',
  'Jaiz Bank',
  'Taj Bank',
  'Lotus Bank',
  'Globus Bank',
  'Titan Trust Bank',
  'OPay',
  'Moniepoint MFB',
  'Kuda Bank',
  'PalmPay',
  'VFD Microfinance Bank',
  'Rubies Bank'
].sort();

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

  const [bankName, setBankName] = useState('First Bank of Nigeria (FirstBank)');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState('Chukwuemeka Adaeze');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate('/kyc/submit'); // Redirect to document upload step
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

      <SideBanner />

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
              onClick={() => navigate('/profile-setup')}
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
          <Card className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-5">
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
                        <Button
                          key={g}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => setGender(g)}
                          className={`flex-1 h-12 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-secondary text-primary border-primary hover:bg-secondary/90'
                              : 'bg-input text-muted-foreground hover:bg-border/50 border-border'
                          }`}
                        >
                          {g}
                        </Button>
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
            </CardContent>
          </Card>

          {/* Section: Business Info */}
          <Card className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-5">
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
            </CardContent>
          </Card>

          {/* Section: Bank Details */}
          <Card className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="landmark" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-base font-bold text-foreground">
                  Bank Account Details
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-body text-foreground font-semibold">Bank Name</label>
                  <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3.5 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <Icon i="landmark" size={16} className="text-muted-foreground" />
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-sm font-body p-0 focus:ring-0 focus:outline-none text-foreground font-semibold cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select bank</option>
                      {NIGERIAN_BANKS.map((bank) => (
                        <option key={bank} value={bank} className="text-foreground font-medium">
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

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
