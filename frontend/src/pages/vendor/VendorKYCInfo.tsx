import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useKYCInfo } from '@/hooks/vendor/useVendorMutations';
import { useKYCStatus } from '@/hooks/vendor/useVendorQueries';
import { useKYCInfoFormCache } from '@/hooks/vendor/useKYCFormCache';
import { useAuth } from '@/hooks/useAuth';
import { VendorButton } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
import Icon from '@/components/Icon';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SideBanner from '@/components/SideBanner';
import OnboardingStepIndicator from '@/components/vendor/OnboardingStepIndicator';
import { paymentService } from '@/services/paymentService';

const NIGERIAN_BANKS = [
  { name: 'Test Bank (Paystack)', code: '001' },
  { name: 'Access Bank', code: '044' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'First Bank of Nigeria (FirstBank)', code: '011' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Taj Bank', code: '302' },
  { name: 'Lotus Bank', code: '303' },
  { name: 'Globus Bank', code: '103' },
  { name: 'Titan Trust Bank', code: '102' },
  { name: 'OPay', code: '999992' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'PalmPay', code: '999991' },
  { name: 'VFD Microfinance Bank', code: '566' },
  { name: 'Rubies Bank', code: '125' }
].sort((a, b) => a.name.localeCompare(b.name));

export default function VendorKYCInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const { data: kycStatus } = useKYCStatus();

  // Redirect if already submitted
  useEffect(() => {
    if (kycStatus && kycStatus.status !== 'unsubmitted') {
      if (kycStatus.status === 'approved') {
        navigate('/vendor/dashboard', { replace: true });
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

  const [vendorType, setVendorType] = useState<'individual' | 'business'>(formData.vendorType || 'individual');
  const [tin, setTin] = useState(formData.tin || '');
  const [businessName, setBusinessName] = useState(formData.businessName);
  const [cacNo, setCacNo] = useState(formData.cacNo);
  const [businessLicenseId, setBusinessLicenseId] = useState(formData.businessLicenseId);
  const [bankName, setBankName] = useState(formData.bankName);
  const [accountNumber, setAccountNumber] = useState(formData.accountNumber);
  const [accountName, setAccountName] = useState(formData.accountName);
  const [isResolvingBank, setIsResolvingBank] = useState(false);
  const [bankResolveError, setBankResolveError] = useState('');

  const { mutateAsync: saveKYCInfo, isPending } = useKYCInfo();
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-resolve NUBAN
  useEffect(() => {
    const resolveAccount = async () => {
      if (accountNumber.length === 10 && bankName) {
        setIsResolvingBank(true);
        setBankResolveError('');
        try {
          const bankObj = NIGERIAN_BANKS.find(b => b.name === bankName);
          if (bankObj) {
            const res = await paymentService.resolveBankAccount(accountNumber, bankObj.code);
            if (res.success && res.data.accountName) {
              setAccountName(res.data.accountName);
            }
          }
        } catch (err: any) {
          setBankResolveError(err.message || 'Could not verify account details');
        } finally {
          setIsResolvingBank(false);
        }
      }
    };

    const timeoutId = setTimeout(resolveAccount, 500);
    return () => clearTimeout(timeoutId);
  }, [accountNumber, bankName]);

  // Persist form changes to TanStack cache on every update
  useEffect(() => {
    updateForm({ vendorType, tin, businessName, cacNo, businessLicenseId, bankName, accountNumber, accountName });
  }, [vendorType, tin, businessName, cacNo, businessLicenseId, bankName, accountNumber, accountName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!accountName.trim()) {
      setErrorMsg('Account Name is required. Please enter it manually if auto-fetch failed.');
      return;
    }

    try {
      await saveKYCInfo({
        vendorType,
        fullName,
        dob,
        gender,
        businessName,
        tin: vendorType === 'business' ? tin : undefined,
        cacNo: vendorType === 'business' ? cacNo : undefined,
        businessLicenseId,
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
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-body text-foreground font-semibold">Vendor Type</label>
                  <Select value={vendorType} onValueChange={(v) => setVendorType(v as 'individual' | 'business')} required>
                    <SelectTrigger className="w-full bg-input border-border rounded-xl px-3.5 h-[46px] focus:ring-primary/20">
                      <div className="flex items-center gap-2">
                        <Icon i="briefcase" size={16} className="text-muted-foreground flex-shrink-0" />
                        <SelectValue placeholder="Select vendor type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual Seller</SelectItem>
                      <SelectItem value="business">Registered Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {vendorType === 'business' && (
                  <>
                    <VendorInput
                      label="CAC Registration No."
                      placeholder="RC000000"
                      icon="hash"
                      value={cacNo}
                      onChange={(e) => setCacNo(e.target.value)}
                      required
                    />
                    
                    <VendorInput
                      label="Tax ID Number (TIN)"
                      placeholder="Enter TIN"
                      icon="hash"
                      value={tin}
                      onChange={(e) => setTin(e.target.value)}
                      required
                    />
                  </>
                )}

                <VendorInput
                  label="Business Certificate ID"
                  placeholder="Enter Business Certificate ID"
                  icon="file-text"
                  value={businessLicenseId}
                  onChange={(e) => setBusinessLicenseId(e.target.value)}
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
                  <Select value={bankName} onValueChange={setBankName} required>
                    <SelectTrigger className="w-full bg-input border-border rounded-xl px-3.5 h-[46px] focus:ring-primary/20">
                      <div className="flex items-center gap-2">
                        <Icon i="landmark" size={16} className="text-muted-foreground flex-shrink-0" />
                        <SelectValue placeholder="Select bank" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_BANKS.map((bank) => (
                        <SelectItem key={bank.name} value={bank.name}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5 w-full relative">
                  <VendorInput
                    label="Account Number"
                    placeholder="10-digit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    required
                  />
                  {isResolvingBank && (
                    <div className="absolute right-3 top-[34px]">
                      <Loader2 size={16} className="animate-spin text-primary" />
                    </div>
                  )}
                  {bankResolveError && (
                    <span className="text-[10px] text-destructive absolute -bottom-4 left-1 font-semibold">{bankResolveError}</span>
                  )}
                </div>

                <VendorInput
                  label="Account Name"
                  placeholder="Auto-fetched after entering account number"
                  icon="user"
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
