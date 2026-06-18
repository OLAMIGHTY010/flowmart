import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useKYCSubmit } from '@/hooks/useRiderMutations';
import { 
  useProfileSetupFormCache, 
  useKYCInfoFormCache, 
  useKYCSubmitFormCache 
} from '@/hooks/useKYCFormCache';
import { useAuth } from '@/hooks/useAuth';
import { VendorButton } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/Icon';
import SideBanner from '@/components/SideBanner';

export default function KYCReview() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [agreed, setAgreed] = useState(false);

  const { formData: profileData } = useProfileSetupFormCache();
  const { formData: kycInfo } = useKYCInfoFormCache();
  const { formData: kycSubmitData } = useKYCSubmitFormCache();

  const { mutateAsync: submitKYC, isPending } = useKYCSubmit();

  const handleFinalSubmit = async () => {
    if (!agreed) {
      setErrorMsg("You must agree to the declaration before submitting.");
      return;
    }
    setErrorMsg('');

    try {
      const payload = {
        // Profile
        displayName: profileData.displayName || user?.fullName || '',
        businessPhone: profileData.phone || user?.phone || '',
        stateRegion: profileData.stateRegion,
        city: profileData.city,
        bio: profileData.bio,
        avatar: profileData.avatar,

        // Identity & Bank
        fullName: user?.fullName,
        dob: user?.dob,
        gender: user?.gender,
        bankName: kycInfo.bankName,
        accountNumber: kycInfo.accountNumber,
        accountName: kycInfo.accountName,

        // Vehicle
        vehicleType: kycInfo.vehicleType,
        makeModel: kycInfo.makeModel,
        year: kycInfo.year,
        plateNumber: kycInfo.plateNumber,
        color: kycInfo.color,

        // Guarantor & IDs
        govIdType: kycSubmitData.govIdType,
        guarantorName: kycSubmitData.guarantorName,
        guarantorPhone: kycSubmitData.guarantorPhone,
        guarantorRelationship: kycSubmitData.guarantorRelationship,
      };

      await submitKYC(payload);
      await refreshUser();
      navigate('/kyc/verification');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit KYC application. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      <div className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/kyc/submit')}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center cursor-pointer hover:bg-border/60 transition-colors"
            >
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headings text-foreground leading-tight">
                Review Application
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Please review your details before final submission</p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Personal & Bank Details */}
          <Card className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-border/50 px-5 py-3 flex justify-between items-center">
              <span className="font-bold text-foreground flex items-center gap-2">
                <Icon i="user" size={15} className="text-primary" />
                Personal & Bank Details
              </span>
              <button onClick={() => navigate('/kyc')} className="text-primary text-xs font-bold hover:underline cursor-pointer">
                Edit
              </button>
            </div>
            <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <DetailItem label="Full Name" value={user?.fullName || '—'} />
              <DetailItem label="Date of Birth" value={user?.dob || '—'} />
              <DetailItem label="Bank Name" value={kycInfo.bankName || '—'} />
              <DetailItem label="Account Number" value={kycInfo.accountNumber || '—'} />
              <DetailItem label="Account Name" value={kycInfo.accountName || '—'} />
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-border/50 px-5 py-3 flex justify-between items-center">
              <span className="font-bold text-foreground flex items-center gap-2">
                <Icon i="truck" size={15} className="text-primary" />
                Vehicle Details
              </span>
              <button onClick={() => navigate('/kyc')} className="text-primary text-xs font-bold hover:underline cursor-pointer">
                Edit
              </button>
            </div>
            <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <DetailItem label="Vehicle Type" value={kycInfo.vehicleType || '—'} />
              <DetailItem label="Make & Model" value={kycInfo.makeModel || '—'} />
              <DetailItem label="Year" value={kycInfo.year || '—'} />
              <DetailItem label="Plate Number" value={kycInfo.plateNumber || '—'} />
              <DetailItem label="Color" value={kycInfo.color || '—'} />
            </CardContent>
          </Card>

          {/* Guarantor Details */}
          <Card className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-border/50 px-5 py-3 flex justify-between items-center">
              <span className="font-bold text-foreground flex items-center gap-2">
                <Icon i="users" size={15} className="text-primary" />
                Guarantor Details
              </span>
              <button onClick={() => navigate('/kyc/submit')} className="text-primary text-xs font-bold hover:underline cursor-pointer">
                Edit
              </button>
            </div>
            <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <DetailItem label="Guarantor Name" value={kycSubmitData.guarantorName || '—'} />
              <DetailItem label="Phone Number" value={kycSubmitData.guarantorPhone || '—'} />
              <DetailItem label="Relationship" value={kycSubmitData.guarantorRelationship || '—'} />
            </CardContent>
          </Card>

          {/* Documents summary */}
          <Card className="bg-surface rounded-2xl border border-border/70 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-border/50 px-5 py-3 flex justify-between items-center">
              <span className="font-bold text-foreground flex items-center gap-2">
                <Icon i="file-text" size={15} className="text-primary" />
                Uploaded Documents
              </span>
            </div>
            <CardContent className="p-5 flex flex-col gap-3">
              {[...kycInfo.documents, ...kycSubmitData.documents].map(doc => (
                <div key={doc.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Icon i="check" size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{doc.title}</p>
                    {doc.status === 'uploaded' ? (
                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                    ) : (
                      <p className="text-xs text-destructive">Missing</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Declaration */}
          <div className="bg-input border border-border rounded-xl p-4 flex items-start gap-3 mt-4">
            <input 
              type="checkbox" 
              id="agree" 
              className="mt-1 cursor-pointer w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <label htmlFor="agree" className="text-xs sm:text-sm text-muted-foreground cursor-pointer select-none leading-relaxed">
              I hereby declare that the information provided is true and accurate. I understand that FlowMart reserves the right to suspend or terminate my rider account if any information is found to be false or misleading.
            </label>
          </div>

          <VendorButton
            onClick={handleFinalSubmit}
            disabled={!agreed || isPending}
            className={`w-full py-4 text-base ${!agreed ? 'opacity-50' : ''}`}
          >
            {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin inline" /> Submitting...</> : 'Submit Application'}
          </VendorButton>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-foreground truncate">{value}</span>
    </div>
  );
}
