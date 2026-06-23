import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useKYCDocUpload } from '@/hooks/vendor/useVendorMutations';
import { useKYCStatus } from '@/hooks/vendor/useVendorQueries';
import { useKYCSubmitFormCache } from '@/hooks/vendor/useKYCFormCache';
import { VendorButton } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/Icon';
import SideBanner from '@/components/SideBanner';
import OnboardingStepIndicator from '@/components/vendor/OnboardingStepIndicator';

type DocStatus = 'uploaded' | 'upload';

interface UploadDoc {
  id: string;
  title: string;
  subtitle: string;
  status: DocStatus;
  fileName?: string;
  filePreviewUrl?: string;
  base64?: string;
}

const GOV_ID_TYPES = [
  { value: 'national_id', label: 'National ID Card' },
  { value: 'passport', label: 'International Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'voters_card', label: "Voter's Card" },
];

const RELATIONSHIPS = [
  'Parent',
  'Sibling',
  'Spouse',
  'Friend',
  'Business Partner',
  'Colleague',
  'Other',
];

export default function VendorKYCSubmit() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const { mutateAsync: uploadDoc } = useKYCDocUpload();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  // TanStack-cached form data (persists on back navigation)
  const { formData, updateForm } = useKYCSubmitFormCache();

  const [govIdType, setGovIdType] = useState(formData.govIdType);
  const [guarantorName, setGuarantorName] = useState(formData.guarantorName);
  const [guarantorPhone, setGuarantorPhone] = useState(formData.guarantorPhone);
  const [guarantorRelationship, setGuarantorRelationship] = useState(formData.guarantorRelationship);
  const [documents, setDocuments] = useState<UploadDoc[]>(formData.documents);

  // Persist form changes to TanStack cache
  useEffect(() => {
    updateForm({ govIdType, guarantorName, guarantorPhone, guarantorRelationship, documents });
  }, [govIdType, guarantorName, guarantorPhone, guarantorRelationship, documents]);

  const handleCardClick = (id: string, status: DocStatus) => {
    if (status === 'upload') {
      setActiveDocId(id);
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDocId) {
      setUploadingId(activeDocId);
      setErrorMsg('');

      try {
        // Read file as Base64 string
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });

        await uploadDoc({ docType: activeDocId, file });

        const previewUrl = URL.createObjectURL(file);
        
        setDocuments(docs =>
          docs.map(doc =>
            doc.id === activeDocId
              ? { 
                  ...doc, 
                  status: 'uploaded' as DocStatus, 
                  fileName: file.name, 
                  filePreviewUrl: previewUrl,
                  base64: base64Data
                }
              : doc
          )
        );
      } catch (err: any) {
        setErrorMsg(`Failed to upload ${file.name}. Please try again.`);
      } finally {
        setUploadingId(null);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveDocId(null);
  };

  const handleRemoveFile = (id: string) => {
    setDocuments(docs =>
      docs.map(doc =>
        doc.id === id
          ? { ...doc, status: 'upload' as DocStatus, fileName: undefined, filePreviewUrl: undefined, base64: undefined }
          : doc
      )
    );
  };

  const allDocsUploaded = documents.every(doc => doc.status === 'uploaded');
  const guarantorComplete = guarantorName.trim() && guarantorPhone.trim() && guarantorRelationship;
  const canProceed = allDocsUploaded && guarantorComplete;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      <div className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="mb-6 sm:mb-8 border-b border-border/80 pb-4">
          <OnboardingStepIndicator currentStep={5} />
        </div>

        <div className="space-y-5 sm:space-y-6">
          {/* Heading */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/kyc')}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center cursor-pointer hover:bg-border/60 transition-colors"
            >
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headings text-foreground leading-tight">
                KYC Verification
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Upload required documents & guarantor details</p>
            </div>
          </div>

          {/* Status banner */}
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#f59e0b]/10 flex items-center justify-center flex-shrink-0">
              <Icon i="alert-circle" size={16} className="text-[#d97706]" />
            </div>
            <p className="text-xs sm:text-sm text-foreground flex-1 font-medium">
              Verification takes 1–2 business days after all documents are uploaded.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* ─── Government ID Section ─── */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="shield" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Government ID
                </span>
              </div>

              {/* ID Type selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">ID Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GOV_ID_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setGovIdType(type.value)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        govIdType === type.value
                          ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]'
                          : 'bg-input text-muted-foreground hover:bg-border/50 border-border'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Card for Government ID */}
              {renderUploadCard(
                documents.find(d => d.id === 'government_id')!,
                uploadingId,
                handleCardClick,
                handleRemoveFile
              )}
            </CardContent>
          </Card>

          {/* ─── Camp Certificate Upload ─── */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="file-text" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Camp Certificate
                </span>
              </div>

              {renderUploadCard(
                documents.find(d => d.id === 'camp_certificate')!,
                uploadingId,
                handleCardClick,
                handleRemoveFile
              )}
            </CardContent>
          </Card>

          {/* ─── Guarantor Details Section ─── */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="users" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Guarantor Details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <VendorInput
                  label="Guarantor Full Name"
                  placeholder="Enter guarantor's name"
                  icon="user"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  required
                />

                <VendorInput
                  label="Guarantor Phone"
                  placeholder="08012345678"
                  icon="phone"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-body text-foreground font-semibold">Relationship</label>
                  <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3.5 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <Icon i="heart" size={16} className="text-muted-foreground" />
                    <select
                      value={guarantorRelationship}
                      onChange={(e) => setGuarantorRelationship(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-sm font-body p-0 focus:ring-0 focus:outline-none text-foreground font-semibold cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select relationship</option>
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel} className="text-foreground font-medium">
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Guarantor ID Upload */}
              <div className="mt-1">
                <label className="text-sm font-semibold text-foreground mb-2 block">Guarantor ID Document</label>
                {renderUploadCard(
                  documents.find(d => d.id === 'guarantor_id')!,
                  uploadingId,
                  handleCardClick,
                  handleRemoveFile
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf"
          />

          {/* Security notice */}
          <div className="bg-[#dcfce7] rounded-xl px-4 py-3 flex items-center gap-3">
            <Icon i="shield-check" size={20} className="text-[#16a34a] flex-shrink-0" />
            <p className="text-xs sm:text-sm text-[#15803d] flex-1 font-medium">
              Your documents are encrypted and securely stored.
            </p>
          </div>

          {/* Submit button */}
          <VendorButton
            onClick={() => navigate('/kyc/review')}
            disabled={!canProceed}
            className={!canProceed ? 'opacity-60 cursor-not-allowed' : ''}
          >
            Review Application
          </VendorButton>

          {!canProceed && (
            <p className="text-xs text-center text-muted-foreground font-medium -mt-2">
              Please upload all documents and fill guarantor details to proceed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Upload Card Component ─── */
function renderUploadCard(
  doc: UploadDoc,
  uploadingId: string | null,
  onUpload: (id: string, status: DocStatus) => void,
  onRemove: (id: string) => void,
) {
  const isUploading = uploadingId === doc.id;
  const isUploaded = doc.status === 'uploaded';

  return (
    <div
      onClick={() => !isUploading && !isUploaded && onUpload(doc.id, doc.status)}
      className={`relative rounded-2xl border-2 border-dashed transition-all ${
        isUploaded
          ? 'border-[#86efac] bg-[#f0fdf4]'
          : 'border-border hover:border-[#16a34a]/40 bg-[#fafafa] cursor-pointer hover:bg-[#f0fdf4]/50'
      } p-4 sm:p-5`}
    >
      {isUploading ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <Loader2 className="h-8 w-8 text-[#16a34a] animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Uploading...</p>
        </div>
      ) : isUploaded ? (
        <div className="flex items-center gap-3 sm:gap-4">
          {/* File icon / thumbnail */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#dcfce7] flex items-center justify-center flex-shrink-0">
            {doc.filePreviewUrl && doc.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={doc.filePreviewUrl}
                alt={doc.fileName}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Icon i="file-check" size={24} className="text-[#16a34a]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{doc.title}</p>
            <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16a34a] bg-[#dcfce7] px-2.5 py-1 rounded-full">
              Uploaded
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(doc.id);
              }}
              className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors cursor-pointer"
              aria-label="Remove file"
            >
              <Icon i="x" size={12} className="text-destructive" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 sm:py-6 gap-2">
          <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center">
            <Icon i="upload" size={22} className="text-[#16a34a]" />
          </div>
          <p className="text-sm font-bold text-foreground">{doc.title}</p>
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">{doc.subtitle}</p>
          <span className="text-[10px] text-muted-foreground mt-1 font-medium">
            JPG, PNG or PDF • Max 5MB
          </span>
        </div>
      )}
    </div>
  );
}
