import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useKYCDocUpload } from '@/hooks/vendor/useVendorMutations';
import { useKYCStatus } from '@/hooks/vendor/useVendorQueries';
import { useKYCSubmitFormCache, useKYCInfoFormCache } from '@/hooks/vendor/useKYCFormCache';
import { VendorButton } from '@/components/ui/button';
import { VendorInput } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/Icon';
import SideBanner from '@/components/SideBanner';
import OnboardingStepIndicator from '@/components/vendor/OnboardingStepIndicator';
import type { Guarantor } from '@/types/api';

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

interface LocalGuarantor extends Guarantor {
  localId: string;
  idCardMeta?: {
    fileName?: string;
    filePreviewUrl?: string;
  };
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
  const guarantorFileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeGuarantorId, setActiveGuarantorId] = useState<string | null>(null);

  const { mutateAsync: uploadDoc } = useKYCDocUpload();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  // TanStack-cached form data (persists on back navigation)
  const { formData: infoData } = useKYCInfoFormCache();
  const { formData, updateForm } = useKYCSubmitFormCache();
  const vendorType = infoData.vendorType || 'individual';

  const [govIdType, setGovIdType] = useState(formData.govIdType);
  
  // Filter out guarantor_id from global documents if it exists
  const initialDocs = (formData.documents || []).filter(d => d.id !== 'guarantor_id');
  const [documents, setDocuments] = useState<UploadDoc[]>(initialDocs);

  // Initialize guarantors (minimum 2)
  const defaultGuarantor = (): LocalGuarantor => ({
    localId: Math.random().toString(36).substring(7),
    name: '',
    phone: '',
    nin: '',
    relationship: '',
    address: '',
    occupation: '',
  });

  const getInitialGuarantors = () => {
    if (formData.guarantors && formData.guarantors.length > 0) {
      const mapped = formData.guarantors.map((g: any) => ({
        ...g,
        localId: g.localId || Math.random().toString(36).substring(7)
      }));
      while (mapped.length < 2) mapped.push(defaultGuarantor());
      return mapped;
    }
    return [defaultGuarantor(), defaultGuarantor()];
  };

  const [guarantors, setGuarantors] = useState<LocalGuarantor[]>(getInitialGuarantors());

  // Persist form changes to TanStack cache
  useEffect(() => {
    updateForm({ 
      govIdType, 
      documents,
      guarantors 
    });
  }, [govIdType, documents, guarantors]);

  const handleCardClick = (id: string, status: DocStatus) => {
    if (status === 'upload') {
      setActiveDocId(id);
      fileInputRef.current?.click();
    }
  };

  const handleGuarantorCardClick = (localId: string, status: DocStatus) => {
    if (status === 'upload') {
      setActiveGuarantorId(localId);
      guarantorFileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDocId) {
      setUploadingId(activeDocId);
      setErrorMsg('');

      try {
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

  const handleGuarantorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeGuarantorId) {
      setUploadingId(`guarantor_${activeGuarantorId}`);
      setErrorMsg('');

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });

        // Optionally, one could upload the doc to the server here as well
        // await uploadDoc({ docType: 'guarantor_id', file });

        const previewUrl = URL.createObjectURL(file);
        
        setGuarantors(prev => prev.map(g => {
          if (g.localId === activeGuarantorId) {
            return {
              ...g,
              idCardFile: base64Data,
              idCardMeta: {
                fileName: file.name,
                filePreviewUrl: previewUrl
              }
            };
          }
          return g;
        }));
      } catch (err: any) {
        setErrorMsg(`Failed to process ${file.name}. Please try again.`);
      } finally {
        setUploadingId(null);
      }
    }
    if (guarantorFileInputRef.current) {
      guarantorFileInputRef.current.value = '';
    }
    setActiveGuarantorId(null);
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

  const handleRemoveGuarantorFile = (localId: string) => {
    setGuarantors(prev => prev.map(g => {
      if (g.localId === localId) {
        return {
          ...g,
          idCardFile: undefined,
          idCardMeta: undefined
        };
      }
      return g;
    }));
  };

  const updateGuarantor = (localId: string, field: keyof LocalGuarantor, value: string) => {
    setGuarantors(prev => prev.map(g => g.localId === localId ? { ...g, [field]: value } : g));
  };

  const addGuarantor = () => {
    setGuarantors(prev => [...prev, defaultGuarantor()]);
  };

  const removeGuarantor = (localId: string) => {
    if (guarantors.length <= 2) return;
    setGuarantors(prev => prev.filter(g => g.localId !== localId));
  };

  // Determine which documents are required based on vendorType
  const requiredDocIds = ['government_id', 'camp_certificate', 'bank_reference'];
  if (vendorType === 'business') {
    requiredDocIds.push('cac_document');
  }

  const allDocsUploaded = requiredDocIds.every(reqId => {
    const doc = documents.find(d => d.id === reqId);
    return doc?.status === 'uploaded';
  });

  const guarantorsComplete = guarantors.length >= 2 && guarantors.every(g => 
    g.name.trim() && 
    g.phone.trim() && 
    g.nin.trim() && 
    g.relationship && 
    g.address.trim() && 
    g.occupation.trim() && 
    !!g.idCardFile
  );

  const canProceed = allDocsUploaded && guarantorsComplete;

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
                documents.find(d => d.id === 'government_id') || { id: 'government_id', title: 'Government ID', subtitle: 'Upload ID', status: 'upload' },
                uploadingId,
                handleCardClick,
                handleRemoveFile
              )}
            </CardContent>
          </Card>

          {/* ─── Business Certificate Upload ─── */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="file-text" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Business Certificate
                </span>
              </div>

              {renderUploadCard(
                documents.find(d => d.id === 'camp_certificate') || { id: 'camp_certificate', title: 'Business Certificate', subtitle: 'Upload certificate', status: 'upload' },
                uploadingId,
                handleCardClick,
                handleRemoveFile
              )}
            </CardContent>
          </Card>

          {/* ─── Business & Bank Documents ─── */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Icon i="briefcase" size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Business & Bank Documents
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">Bank Reference / Statement</label>
                  {renderUploadCard(
                    documents.find(d => d.id === 'bank_reference') || { id: 'bank_reference', title: 'Bank Reference', subtitle: 'Upload statement', status: 'upload' },
                    uploadingId,
                    handleCardClick,
                    handleRemoveFile
                  )}
                </div>

                {vendorType === 'business' && (
                  <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-border/50">
                    <label className="text-sm font-semibold text-foreground">CAC Registration Document</label>
                    {renderUploadCard(
                      documents.find(d => d.id === 'cac_document') || { id: 'cac_document', title: 'CAC Registration Document', subtitle: 'Upload CAC', status: 'upload' },
                      uploadingId,
                      handleCardClick,
                      handleRemoveFile
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Guarantors Section ─── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Guarantors (Minimum 2)</h3>
            </div>
            
            {guarantors.map((guarantor, index) => (
              <Card key={guarantor.localId} className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
                <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                        <Icon i="users" size={13} className="text-primary-foreground" />
                      </div>
                      <span className="text-sm sm:text-base font-bold text-foreground">
                        Guarantor {index + 1}
                      </span>
                    </div>
                    {guarantors.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeGuarantor(guarantor.localId)}
                        className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Icon i="trash-2" size={14} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                    <VendorInput
                      label="Guarantor Full Name"
                      placeholder="Enter guarantor's name"
                      icon="user"
                      value={guarantor.name}
                      onChange={(e) => updateGuarantor(guarantor.localId, 'name', e.target.value)}
                      required
                    />

                    <VendorInput
                      label="Guarantor Phone"
                      placeholder="08012345678"
                      icon="phone"
                      value={guarantor.phone}
                      onChange={(e) => updateGuarantor(guarantor.localId, 'phone', e.target.value)}
                      required
                    />

                    <VendorInput
                      label="Guarantor NIN"
                      placeholder="11-digit NIN"
                      icon="shield"
                      value={guarantor.nin}
                      onChange={(e) => updateGuarantor(guarantor.localId, 'nin', e.target.value.replace(/\D/g, '').slice(0, 11))}
                      maxLength={11}
                      required
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-sm font-body text-foreground font-semibold">Relationship</label>
                      <Select value={guarantor.relationship} onValueChange={(val) => updateGuarantor(guarantor.localId, 'relationship', val)} required>
                        <SelectTrigger className="w-full bg-input border-border rounded-xl px-3.5 h-[46px] focus:ring-primary/20">
                          <div className="flex items-center gap-2">
                            <Icon i="heart" size={16} className="text-muted-foreground flex-shrink-0" />
                            <SelectValue placeholder="Select relationship" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIPS.map((rel) => (
                            <SelectItem key={rel} value={rel}>
                              {rel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <VendorInput
                      label="Occupation"
                      placeholder="Enter guarantor's occupation"
                      icon="briefcase"
                      value={guarantor.occupation}
                      onChange={(e) => updateGuarantor(guarantor.localId, 'occupation', e.target.value)}
                      required
                    />

                    <VendorInput
                      label="Address"
                      placeholder="Enter guarantor's residential address"
                      icon="map-pin"
                      value={guarantor.address}
                      onChange={(e) => updateGuarantor(guarantor.localId, 'address', e.target.value)}
                      required
                    />
                  </div>

                  {/* Guarantor ID Upload */}
                  <div className="mt-1">
                    <label className="text-sm font-semibold text-foreground mb-2 block">Guarantor ID Document</label>
                    {renderUploadCard(
                      {
                        id: guarantor.localId,
                        title: 'Guarantor ID',
                        subtitle: "Upload guarantor's government-issued ID",
                        status: guarantor.idCardFile ? 'uploaded' : 'upload',
                        fileName: guarantor.idCardMeta?.fileName,
                        filePreviewUrl: guarantor.idCardMeta?.filePreviewUrl,
                      },
                      uploadingId === `guarantor_${guarantor.localId}` ? guarantor.localId : null,
                      handleGuarantorCardClick,
                      handleRemoveGuarantorFile
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <button
              type="button"
              onClick={addGuarantor}
              className="w-full py-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-primary font-semibold hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <Icon i="plus" size={18} />
              Add Another Guarantor
            </button>
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf"
          />
          <input
            type="file"
            ref={guarantorFileInputRef}
            className="hidden"
            onChange={handleGuarantorFileChange}
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
              Please upload all required documents and fill all details for at least 2 guarantors to proceed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Upload Card Component ─── */
function renderUploadCard(
  doc: UploadDoc | { id: string, title: string, subtitle: string, status: DocStatus, fileName?: string, filePreviewUrl?: string },
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
