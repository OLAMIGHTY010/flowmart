import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useKYCSubmit } from '@/hooks/vendor/useVendorMutations';
import { useKYCStatus } from '@/hooks/vendor/useVendorQueries';
import { useKYCInfoFormCache, useKYCSubmitFormCache, useProfileSetupFormCache } from '@/hooks/vendor/useKYCFormCache';
import { useAuth } from '@/hooks/useAuth';
import { VendorButton } from '@/components/ui/button';
import Icon from '@/components/Icon'; 
import SideBanner from '@/components/SideBanner';
import OnboardingStepIndicator from '@/components/vendor/OnboardingStepIndicator';

const compressBase64Image = (base64Str: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function VendorKYCReview() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [isDeclarationChecked, setIsDeclarationChecked] = useState(false);

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

  // Form Data from Cache
  const { formData: infoData } = useKYCInfoFormCache();
  const { formData: submitData } = useKYCSubmitFormCache();
  const { formData: profileData } = useProfileSetupFormCache();

  // Personal Info from Auth Context & Form Cache
  const personalInfo = {
    fullName: user?.fullName || '',
    dob: profileData.dob || user?.dob || '',
    gender: profileData.gender || user?.gender || '',
  };

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

  const reviewSections = [
    {
      heading: 'Personal Information',
      icon: 'user',
      path: '/profile-setup',
      items: [
        { label: 'Full Name', value: personalInfo.fullName},
        { label: 'Date of Birth', value: formatDob(personalInfo.dob) },
        { label: 'Gender', value: personalInfo.gender},
      ],
    },
    {
      heading: 'Business Information',
      icon: 'briefcase',
      path: '/profile-setup',
      items: [
        { label: 'Vendor Type', value: infoData.vendorType === 'business' ? 'Registered Business' : 'Individual Seller' },
        { label: 'Business Name', value: profileData.businessName || infoData.businessName || '—' },
        { label: 'Business Phone', value: profileData.businessPhone || '—' },
        { label: 'State / City', value: `${profileData.stateRegion || ''} / ${profileData.city || ''}` },
        ...(infoData.vendorType === 'business' 
          ? [
              { label: 'CAC Reg. No.', value: infoData.cacNo || '—' },
              { label: 'TIN', value: infoData.tin || '—' }
            ] 
          : []),
        { label: 'Camp Certificate ID', value: infoData.campCertificateId || '—' },
      ],
    },
    {
      heading: 'Bank Details',
      icon: 'landmark',
      path: '/kyc',
      items: [
        { label: 'Bank', value: infoData.bankName || '—' },
        { label: 'Account No.', value: infoData.accountNumber || '—' },
        { label: 'Account Name', value: infoData.accountName || '—' },
      ],
    },
    {
      heading: 'Guarantor Details',
      icon: 'users',
      path: '/kyc/submit',
      items: [
        { label: 'Guarantor Name', value: submitData.guarantorName || '—' },
        { label: 'Phone', value: submitData.guarantorPhone || '—' },
        { label: 'Relationship', value: submitData.guarantorRelationship || '—' },
      ],
    },
  ];

  const docStatuses = submitData.documents.map(doc => ({
    label: doc.title,
    status: doc.status === 'uploaded' ? 'Uploaded' : 'Missing',
    icon: doc.id === 'government_id' ? 'shield' : doc.id === 'camp_certificate' ? 'file-text' : 'users'
  }));

  const { mutateAsync: submitKYC, isPending } = useKYCSubmit();
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeclarationChecked) return;
    setErrorMsg('');

    try {
      let governmentIdFile = submitData.documents.find(d => d.id === 'government_id')?.base64;
      let campCertificateFile = submitData.documents.find(d => d.id === 'camp_certificate')?.base64;
      let guarantorIdFile = submitData.documents.find(d => d.id === 'guarantor_id')?.base64;
      let avatarFile = profileData.avatar;

      let bankReferenceFile = submitData.documents.find(d => d.id === 'bank_reference')?.base64;
      let cacDocumentFile = submitData.documents.find(d => d.id === 'cac_document')?.base64;

      if (governmentIdFile) governmentIdFile = await compressBase64Image(governmentIdFile);
      if (campCertificateFile) campCertificateFile = await compressBase64Image(campCertificateFile);
      if (guarantorIdFile) guarantorIdFile = await compressBase64Image(guarantorIdFile);
      if (avatarFile) avatarFile = await compressBase64Image(avatarFile);
      if (bankReferenceFile) bankReferenceFile = await compressBase64Image(bankReferenceFile);
      if (cacDocumentFile) cacDocumentFile = await compressBase64Image(cacDocumentFile);

      await submitKYC({
        // Profile Setup Fields
        displayName: personalInfo.fullName,
        businessName: profileData.businessName || infoData.businessName,
        businessPhone: profileData.businessPhone,
        stateRegion: profileData.stateRegion,
        city: profileData.city,
        bio: profileData.bio,
        avatar: avatarFile,
        
        // KYC Info Fields
        vendorType: infoData.vendorType,
        fullName: personalInfo.fullName,
        dob: personalInfo.dob,
        gender: personalInfo.gender,
        tin: infoData.tin,
        cacNo: infoData.cacNo,
        campCertificateId: infoData.campCertificateId,
        bankName: infoData.bankName,
        accountNumber: infoData.accountNumber,
        accountName: infoData.accountName,
        
        // KYC Submit Fields
        govIdType: submitData.govIdType,
        guarantorName: submitData.guarantorName,
        guarantorPhone: submitData.guarantorPhone,
        guarantorRelationship: submitData.guarantorRelationship,
        governmentIdFile,
        campCertificateFile,
        guarantorIdFile,
        bankReferenceFile,
        cacDocumentFile,
      });

      await refreshUser();

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/kyc/verification');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit KYC. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center text-white">
            <Icon i="check" size={12} />
          </div>
          <span className="text-sm font-semibold">Verification Request Submitted!</span>
        </div>
      )}

      <SideBanner />

      {/* Main Review Form */}
      <div className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8 border-b border-border/80 pb-4">
          <OnboardingStepIndicator currentStep={6} />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/kyc/submit')}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center hover:bg-border/60 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headings text-foreground leading-tight">
                Review & Submit
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Confirm your details before submitting for approval
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium mb-6">
            {errorMsg}
          </div>
        )}

        {/* Completion Bar */}
        <div className="bg-[#dcfce7] rounded-2xl px-4 sm:px-6 py-4 flex items-center gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-[#15803d]">KYC Completion Status</span>
              <span className="text-xs font-extrabold text-[#15803d]">100% Complete</span>
            </div>
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-[#16a34a] rounded-full transition-all duration-500" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* TABLE FOR TABLET & DESKTOP, CARDS FOR MOBILE */}
        <div className="mb-6 sm:mb-8">
          {/* Table View (shown on md/lg screens) */}
          <div className="hidden md:block overflow-x-auto border border-border rounded-2xl bg-surface shadow-xs">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-input border-b border-border text-muted-foreground font-semibold">
                  <th className="px-4 lg:px-6 py-4">Section / Category</th>
                  <th className="px-4 lg:px-6 py-4">Information Field</th>
                  <th className="px-4 lg:px-6 py-4">Submitted Details</th>
                  <th className="px-4 lg:px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground font-medium">
                {reviewSections.map((section, si) =>
                  section.items.map((item, ii) => (
                    <tr key={`${si}-${ii}`} className="hover:bg-muted/30 transition-colors">
                      {ii === 0 ? (
                        <td
                          className="px-4 lg:px-6 py-4 font-bold align-top border-r border-border/40 text-primary"
                          rowSpan={section.items.length}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                              <Icon i={section.icon} size={12} />
                            </div>
                            <span className="text-xs lg:text-sm">{section.heading}</span>
                          </div>
                        </td>
                      ) : null}
                      <td className="px-4 lg:px-6 py-4 text-muted-foreground text-xs lg:text-sm">{item.label}</td>
                      <td className="px-4 lg:px-6 py-4 font-semibold text-xs lg:text-sm">{item.value}</td>
                      {ii === 0 ? (
                        <td
                          className="px-4 lg:px-6 py-4 text-right align-middle"
                          rowSpan={section.items.length}
                        >
                          <button
                            type="button"
                            onClick={() => navigate(section.path)}
                            className="text-xs text-primary font-bold hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cards View (fallback for mobile screens) */}
          <div className="md:hidden flex flex-col gap-4">
            {reviewSections.map((section, si) => (
              <div key={si} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-input">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                      <Icon i={section.icon} size={13} className="text-primary-foreground" />
                    </div>
                    <span className="text-sm font-bold text-foreground">{section.heading}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(section.path)}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="px-4 py-3.5 flex flex-col gap-3">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">{item.label}</span>
                      <span className="text-foreground font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Documents Table */}
        <div className="mb-6 sm:mb-8">
          <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-xs">
            <div className="flex items-center gap-2 px-4 sm:px-6 py-4 border-b border-border bg-input">
              <div className="w-6 h-6 bg-[#16a34a] rounded-md flex items-center justify-center">
                <Icon i="file-check" size={13} className="text-white" />
              </div>
              <span className="text-sm font-bold text-foreground flex-1">Uploaded Verification Documents</span>
              <button
                type="button"
                onClick={() => navigate('/kyc/submit')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 lg:px-6 py-3">Document Title</th>
                    <th className="px-4 lg:px-6 py-3">Format / Type</th>
                    <th className="px-4 lg:px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground font-medium">
                  {docStatuses.map((doc, di) => (
                    <tr key={di} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 lg:px-6 py-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Icon i={doc.icon} size={14} className="text-[#16a34a]" />
                          <span>{doc.label}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-muted-foreground text-xs">PDF / Image Upload</td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Icon i="check-circle" size={14} className="text-[#16a34a]" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">{doc.status}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Fallback list */}
            <div className="md:hidden px-4 py-3 flex flex-col gap-3">
              {docStatuses.map((doc, di) => (
                <div key={di} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Icon i={doc.icon} size={13} className="text-[#16a34a]" />
                    <span className="text-foreground font-medium">{doc.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#16a34a]">
                    <Icon i="check-circle" size={13} />
                    <span className="font-bold">{doc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Declaration Confirmation Box */}
        <div
          onClick={() => setIsDeclarationChecked(!isDeclarationChecked)}
          className="flex items-start gap-3 bg-input border border-border rounded-xl px-4 sm:px-5 py-4 cursor-pointer hover:bg-border/30 transition-all mb-6 sm:mb-8"
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              isDeclarationChecked
                ? 'border-[#16a34a] bg-[#16a34a] text-white'
                : 'border-muted-foreground/60 bg-transparent'
            }`}
          >
            {isDeclarationChecked && <Icon i="check" size={12} />}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            I confirm that all the information provided is accurate and true. I understand that false information may result in account suspension.
          </p>
        </div>

        <VendorButton onClick={handleSubmit} disabled={!isDeclarationChecked || isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
          Submit Application
        </VendorButton>
      </div>
    </div>
  );
}
