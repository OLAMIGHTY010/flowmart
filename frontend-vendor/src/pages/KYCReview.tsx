import { useState } from 'react';
import { useNavigate } from 'react-router';
import VendorButton from '@/components/VendorButton';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';

const reviewSections = [
  {
    heading: 'Personal Information',
    icon: 'user',
    items: [
      { label: 'Full Name', value: 'Chukwuemeka Adaeze' },
      { label: 'Date of Birth', value: '12 / 04 / 1990' },
      { label: 'BVN', value: '••••••••123' },
    ],
  },
  {
    heading: 'Business Information',
    icon: 'briefcase',
    items: [
      { label: 'Business Name', value: 'Chukwu Ventures Ltd' },
      { label: 'CAC Reg. No.', value: 'RC1234567' },
      { label: 'TIN', value: '12345678-0001' },
    ],
  },
  {
    heading: 'Bank Details',
    icon: 'landmark',
    items: [
      { label: 'Bank', value: 'First Bank Nigeria' },
      { label: 'Account No.', value: '0123456789' },
      { label: 'Account Name', value: 'Chukwuemeka Adaeze' },
    ],
  },
];

const docStatuses = [
  { label: 'National ID / Passport', status: 'Approved' },
  { label: 'Proof of Address', status: 'Approved' },
  { label: 'CAC Certificate', status: 'Uploaded' },
  { label: 'Bank Statement', status: 'Uploaded' },
];

export default function KYCReview() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [isDeclarationChecked, setIsDeclarationChecked] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeclarationChecked) return;
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate('/'); // Redirect to login or next screen
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
            <Icon i="check" size={12} />
          </div>
          <span className="text-sm font-semibold">Verification Request Submitted!</span>
        </div>
      )}

      {/* Side Banner: RCCG Holy Ghost Conference 2025 */}
      <div className="relative hidden lg:flex lg:w-2/5 xl:w-1/3 bg-dark-header text-white p-8 flex-col justify-between overflow-hidden">
        {/* Background Decorative Overlay */}
        <div className="absolute inset-0 opacity-25 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800"
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

      {/* Main Review Form */}
      <div className="flex-1 p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Progress Bar (Desktop Native) */}
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
                Review & Submit
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Confirm your details before submitting for approval
              </p>
            </div>
          </div>
        </div>

        {/* Completion Bar */}
        <div className="bg-secondary rounded-2xl px-6 py-4 flex items-center gap-4 mb-8">
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-primary">KYC Completion Status</span>
              <span className="text-xs font-extrabold text-primary">100% Complete</span>
            </div>
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* TABLE FOR TABLET & DESKTOP, CARDS FOR MOBILE */}
        <div className="mb-8">
          {/* Table View (shown on md/lg screens) */}
          <div className="hidden md:block overflow-x-auto border border-border rounded-2xl bg-surface shadow-xs">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-input border-b border-border text-muted-foreground font-semibold">
                  <th className="px-6 py-4">Section / Category</th>
                  <th className="px-6 py-4">Information Field</th>
                  <th className="px-6 py-4">Submitted Details</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground font-medium">
                {reviewSections.map((section, si) =>
                  section.items.map((item, ii) => (
                    <tr key={`${si}-${ii}`} className="hover:bg-muted/30 transition-colors">
                      {ii === 0 ? (
                        <td
                          className="px-6 py-4 font-bold align-top border-r border-border/40 text-primary"
                          rowSpan={section.items.length}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                              <Icon i={section.icon} size={12} />
                            </div>
                            <span>{section.heading}</span>
                          </div>
                        </td>
                      ) : null}
                      <td className="px-6 py-4 text-muted-foreground">{item.label}</td>
                      <td className="px-6 py-4 font-semibold">{item.value}</td>
                      {ii === 0 ? (
                        <td
                          className="px-6 py-4 text-right align-middle"
                          rowSpan={section.items.length}
                        >
                          <button
                            type="button"
                            onClick={() => navigate('/kyc')}
                            className="text-xs text-primary font-bold hover:underline"
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
                    onClick={() => navigate('/kyc')}
                    className="text-xs text-primary font-bold hover:underline"
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
        <div className="mb-8">
          <div className="border border-border rounded-2xl overflow-hidden bg-surface shadow-xs">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-input">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <Icon i="file-check" size={13} className="text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">Uploaded Verification Documents</span>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Document Title</th>
                    <th className="px-6 py-3">Format / Type</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-foreground font-medium">
                  {docStatuses.map((doc, di) => (
                    <tr key={di} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{doc.label}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">PDF / Image Upload</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-primary">
                          <Icon i="check-circle" size={14} className="text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider">{doc.status}</span>
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
                  <span className="text-muted-foreground font-medium">{doc.label}</span>
                  <div className="flex items-center gap-1 text-primary">
                    <Icon i="check-circle" size={13} className="text-primary" />
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
          className="flex items-start gap-3 bg-input border border-border rounded-xl px-5 py-4 cursor-pointer hover:bg-border/30 transition-all mb-8"
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              isDeclarationChecked
                ? 'border-primary bg-primary text-white'
                : 'border-muted-foreground/60 bg-transparent'
            }`}
          >
            {isDeclarationChecked && <Icon i="check" size={12} />}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            I confirm that all the information provided is accurate and true. I understand that false information may result in account suspension.
          </p>
        </div>

        <VendorButton onClick={handleSubmit} disabled={!isDeclarationChecked}>
          Submit for Verification
        </VendorButton>
      </div>
    </div>
  );
}
