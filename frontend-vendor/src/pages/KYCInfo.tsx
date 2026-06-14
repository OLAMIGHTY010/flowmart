import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useKYCInfo } from '@/hooks/useVendorMutations';
import { useKYCStatus } from '@/hooks/useVendorQueries';
import { useKYCInfoFormCache } from '@/hooks/useKYCFormCache';
import { useAuth } from '@/hooks/useAuth';
import { VendorButton } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
import Icon from '@/components/Icon';
import { Card, CardContent } from '@/components/ui/card';
import SideBanner from '@/components/SideBanner';
import OnboardingStepIndicator from '@/components/OnboardingStepIndicator';

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
  const { user } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const { data: kycStatus } = useKYCStatus();

  // Redirect if already submitted
  useEffect(() => {
    if (kycStatus && kycStatus.status !== 'unsubmitted') {
      if (kycStatus.status === 'approved') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/kyc/verification', { replace: true });
      }
    }
  }, [kycStatus, navigate]);

  // Auto-populated from auth context (read-only)
  const fullName = user?.fullName || '';
  const dob = user?.dob || '';
  const gender = user?.gender || '';

  // TanStack-cached form data (persists on back navigation)
  const { formData, updateForm } = useKYCInfoFormCache();

  const [businessName, setBusinessName] = useState(formData.businessName);
  const [cacNo, setCacNo] = useState(formData.cacNo);
  const [campCertificateId, setCampCertificateId] = useState(formData.campCertificateId);
  const [bankName, setBankName] = useState(formData.bankName);
  const [accountNumber, setAccountNumber] = useState(formData.accountNumber);
  const [accountName, setAccountName] = useState(formData.accountName);

  const { mutateAsync: saveKYCInfo, isPending } = useKYCInfo();
  const [errorMsg, setErrorMsg] = useState('');

  // Persist form changes to TanStack cache on every update
  useEffect(() => {
    updateForm({ businessName, cacNo, campCertificateId, bankName, accountNumber, accountName });
  }, [businessName, cacNo, campCertificateId, bankName, accountNumber, accountName]);

  // const formatDob = (dateStr: string) => {
  //   if (!dateStr) return '—';
  //   try {
  //     const date = new Date(dateStr);
  //     if (isNaN(date.getTime())) return dateStr;
  //     return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  //   } catch {
  //     return dateStr;
  //   }
  // };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await saveKYCInfo({
        fullName,
        dob,
        gender,
        businessName,
        cacNo,
        campCertificateId,
        bankName,
        accountNumber,
        accountName
      });

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/kyc/submit');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save KYC details. Please try again.');
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
          <span className="text-sm font-semibold">KYC Information Saved!</span>
        </div>
      )}

      <SideBanner />

      {/* Main Form Content Panel */}
      <div className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8 border-b border-border/80 pb-4">
          <OnboardingStepIndicator currentStep={4} />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/profile-setup')}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center hover:bg-border/60 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headings text-foreground leading-tight">
                Identity Verification
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Step 3 of 4 • KYC Information
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5 sm:gap-6">
          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Verified Identity Banner */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center flex-shrink-0">
              <Icon i="check" size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#15803d]">Account is successfully verified</p>
              <p className="text-xs text-[#16a34a]/80 truncate">Your identity details have been confirmed</p>
            </div>
          </div>

          {/* Section: Business Info */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="briefcase" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Business Information
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <VendorInput
                  label="Business Name"
                  placeholder="Registered business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />

                <VendorInput
                  label="CAC Registration No."
                  placeholder="RC000000"
                  icon="hash"
                  value={cacNo}
                  onChange={(e) => setCacNo(e.target.value)}
                  required
                />

                <VendorInput
                  label="Camp Certificate ID"
                  placeholder="Enter Camp Certificate ID"
                  icon="file-text"
                  value={campCertificateId}
                  onChange={(e) => setCampCertificateId(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Section: Bank Details */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="landmark" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Bank Account Details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

          <VendorButton type="submit" className="mt-2" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
            Save & Continue
          </VendorButton>
        </form>
      </div>
    </div>
  );
}
