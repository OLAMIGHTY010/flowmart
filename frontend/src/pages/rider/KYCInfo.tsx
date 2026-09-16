import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, ArrowLeft, Upload, Truck, FileText, CheckCircle2 } from 'lucide-react';
import { useKYCInfo } from '@/hooks/useRiderMutations';
import { useKYCStatus } from '@/hooks/useRiderQueries';
import { useKYCInfoFormCache } from '@/hooks/useKYCFormCache';
import { useAuth } from '@/hooks/useAuth';
import { RiderButton } from '@/components/ui/button';
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

const VEHICLE_TYPES = [
  'Motorcycle',
  'Bicycle',
  'Car',
  'Van',
  'Truck'
];

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

export default function KYCInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showToast, setShowToast] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: kycStatus } = useKYCStatus();

  // Redirect if already submitted and not rejected
  useEffect(() => {
    if (kycStatus && kycStatus.status !== 'unsubmitted' && kycStatus.status !== 'rejected') {
      if (kycStatus.status === 'approved') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/kyc/verification', { replace: true });
      }
    }
  }, [kycStatus, navigate]);

  // Auto-populated from auth context (read-only)
  const fullName = user?.fullName || '';
  const dob = user?.dateOfBirth || '';
  const gender = user?.gender || '';

  // TanStack-cached form data
  const { formData, updateForm } = useKYCInfoFormCache();

  const [bankName, setBankName] = useState(formData.bankName);
  const [accountNumber, setAccountNumber] = useState(formData.accountNumber);
  const [accountName, setAccountName] = useState(formData.accountName);
  
  const [vehicleType, setVehicleType] = useState(formData.vehicleType);
  const [makeModel, setMakeModel] = useState(formData.makeModel);
  const [year, setYear] = useState(formData.year);
  const [plateNumber, setPlateNumber] = useState(formData.plateNumber);
  const [color, setColor] = useState(formData.color);
  
  // Merge cached documents with default structure to ensure new fields like car_image exist
  const [documents, setDocuments] = useState<UploadDoc[]>(() => {
    const defaults = [
      { id: 'insurance', title: 'Upload Vehicle Insurance', subtitle: 'Valid insurance document', status: 'upload' },
      { id: 'road_worthiness', title: 'Upload Road Worthiness Certificate', subtitle: 'Valid road worthiness cert', status: 'upload' },
      { id: 'car_image', title: 'Upload Car Image', subtitle: 'Clear photo of your vehicle showing the plate number', status: 'upload' },
    ] as UploadDoc[];
    return defaults.map(def => formData.documents.find(d => d.id === def.id) || def);
  });

  const { mutateAsync: saveKYCInfo, isPending } = useKYCInfo();

  // Persist form changes to TanStack cache on every update
  useEffect(() => {
    updateForm({ 
      bankName, accountNumber, accountName,
      vehicleType, makeModel, year, plateNumber, color, documents 
    });
  }, [bankName, accountNumber, accountName, vehicleType, makeModel, year, plateNumber, color, documents]);

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
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });

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

  const allDocsUploaded = documents.every(doc => doc.status === 'uploaded');
  const vehicleDetailsComplete = vehicleType && makeModel && year && plateNumber && color;
  const bankDetailsComplete = bankName && accountNumber && accountName;
  const canProceed = allDocsUploaded && vehicleDetailsComplete && bankDetailsComplete;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!canProceed) {
      setErrorMsg('Please complete all bank and vehicle details and upload necessary documents.');
      return;
    }

    try {
      await saveKYCInfo({
        fullName,
        dob,
        gender,
        bankName,
        accountNumber,
        accountName,
        vehicleType,
        makeModel,
        year,
        plateNumber,
        color
      });

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate('/kyc/submit');
      }, 500);
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
          <span className="text-sm font-semibold">KYC Details Saved!</span>
        </div>
      )}

      <SideBanner />

      <div className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="mb-6 sm:mb-8 border-b border-border/80 pb-4">
          <OnboardingStepIndicator currentStep={3} />
        </div>

        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/profile-setup')}
              className="w-9 h-9 rounded-full bg-input flex items-center justify-center hover:bg-border/60 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-headings text-foreground leading-tight">
                KYC Details
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Step 3 of 4 — Bank & Vehicle Details
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

          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center flex-shrink-0">
              <Icon i="check" size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#15803d]">Identity Verified</p>
              <p className="text-xs text-[#16a34a]/80 truncate">Your identity details from registration have been confirmed</p>
            </div>
          </div>

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
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
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

          {/* Vehicle Details */}
          <Card className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs">
            <CardContent className="p-0 flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <Truck size={13} className="text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  Vehicle Details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-body text-foreground font-semibold">Vehicle Type</label>
                  <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3.5 py-3.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-sm font-body p-0 focus:ring-0 focus:outline-none text-foreground font-semibold cursor-pointer"
                    >
                      {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type} className="text-foreground font-medium">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <VendorInput
                  label="Vehicle Make & Model"
                  placeholder="e.g. Honda CG 125"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  required
                />

                <VendorInput
                  label="Vehicle Year"
                  placeholder="2022"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />

                <VendorInput
                  label="Plate Number"
                  placeholder="ABC-123XY"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  required
                />

                <VendorInput
                  label="Vehicle Color"
                  placeholder="Black"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-4 mt-2 border-t border-border/50 pt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-semibold text-foreground">Upload Vehicle Insurance</label>
                    {renderUploadCard(
                      documents.find(d => d.id === 'insurance') || { id: 'insurance', title: 'Vehicle Insurance', subtitle: 'Upload valid insurance', status: 'upload' },
                      uploadingId,
                      handleCardClick,
                      'border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50'
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-sm font-semibold text-foreground">Upload Road Worthiness</label>
                    {renderUploadCard(
                      documents.find(d => d.id === 'road_worthiness') || { id: 'road_worthiness', title: 'Road Worthiness', subtitle: 'Upload cert', status: 'upload' },
                      uploadingId,
                      handleCardClick,
                      'border-amber-200 bg-amber-50/50 text-amber-500 hover:bg-amber-50'
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-sm font-semibold text-foreground">Upload Car Image</label>
                  {renderUploadCard(
                    documents.find(d => d.id === 'car_image') || { id: 'car_image', title: 'Car Image', subtitle: 'Clear photo', status: 'upload' },
                    uploadingId,
                    handleCardClick,
                    'border-blue-200 bg-blue-50/50 text-blue-600 hover:bg-blue-50'
                  )}
                </div>
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

          <RiderButton type="submit" className="mt-2" disabled={isPending || !canProceed}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
            Save & Continue
          </RiderButton>
          
          {!canProceed && (
            <p className="text-xs text-center text-muted-foreground font-medium -mt-2">
              Please complete all fields and upload documents to proceed
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function renderUploadCard(
  doc: UploadDoc,
  uploadingId: string | null,
  onUpload: (id: string, status: DocStatus) => void,
  customStyles: string
) {
  const isUploading = uploadingId === doc.id;
  const isUploaded = doc.status === 'uploaded';

  return (
    <div
      onClick={() => !isUploading && onUpload(doc.id, 'upload')}
      className={`relative rounded-2xl border-2 border-dashed transition-all p-5 flex flex-col items-center justify-center cursor-pointer hover:opacity-80 ${customStyles}`}
    >
      {isUploading ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-xs font-medium">Uploading...</p>
        </div>
      ) : isUploaded ? (
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
            {doc.filePreviewUrl && doc.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={doc.filePreviewUrl}
                alt={doc.fileName}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <FileText size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{doc.fileName}</p>
          </div>
          <CheckCircle2 size={20} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <Upload size={22} />
          <p className="text-[13px] font-bold">Tap to upload</p>
        </div>
      )}
    </div>
  );
}