import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useKYCDocUpload } from '@/hooks/useVendorMutations';
import MobileStatusBar from '@/components/MobileStatusBar';
import { VendorButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';
import SideBanner from '@/components/SideBanner';

type DocStatus = 'approved' | 'pending' | 'upload';

interface KYCDoc {
  id: string;
  title: string;
  subtitle: string;
  status: DocStatus;
  fileName?: string;
}

export default function KYCSubmitScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const { mutateAsync: uploadDoc } = useKYCDocUpload();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [documents, setDocuments] = useState<KYCDoc[]>([
    { id: 'national_id', title: 'National ID / Passport', subtitle: 'Government-issued photo ID', status: 'upload' },
    { id: 'proof_address', title: 'Proof of Address', subtitle: 'Utility bill or bank statement', status: 'upload' },
    { id: 'cac', title: 'CAC Certificate', subtitle: 'Business registration document', status: 'upload' },
    { id: 'bank_stmt', title: 'Bank Statement', subtitle: 'Last 3 months statement', status: 'upload' },
  ]);

  const handleCardClick = (id: string, status: DocStatus) => {
    if (status === 'upload' || status === 'pending') {
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
        await uploadDoc({ docType: activeDocId, file });
        
        // Update the document to show it's now pending (uploaded)
        setDocuments(docs => 
          docs.map(doc => 
            doc.id === activeDocId 
              ? { ...doc, status: 'pending', fileName: file.name } 
              : doc
          )
        );
      } catch (err: any) {
        setErrorMsg(`Failed to upload ${file.name}. Please try again.`);
      } finally {
        setUploadingId(null);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveDocId(null);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      <div className="flex-1 p-6 lg:p-12 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="lg:hidden mb-4">
          <MobileStatusBar dark />
        </div>
        {/* Progress bar */}
        <VendorProgressBar steps={['Account', 'Profile', 'KYC', 'Store']} current={2} />

        <div className="mt-8 space-y-6">
          {/* Heading */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/kyc')} className="w-8 h-8 rounded-full bg-input flex items-center justify-center cursor-pointer">
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-xl font-headings text-foreground font-extrabold" style={{ fontWeight: 800 }}>
                KYC Verification
              </h2>
              <p className="text-xs text-muted-foreground">Upload required documents</p>
            </div>
          </div>

          {/* Status banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <Icon i="alert-circle" size={18} className="text-warning" />
            <p className="text-xs text-foreground flex-1" style={{ fontWeight: 500 }}>
              Verification takes 1–2 business days after all documents are uploaded.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Required Documents */}
          <p className="text-sm font-body text-foreground font-bold" style={{ fontWeight: 700 }}>Required Documents</p>
          <div className="flex flex-col gap-3">
            {documents.map((doc) => {
              const isUploading = uploadingId === doc.id;
              return (
                <Card 
                  key={doc.id}
                  title={doc.title} 
                  status={isUploading ? "uploading..." : doc.status} 
                  subtitle={doc.fileName || doc.subtitle}
                  className={doc.status === 'upload' ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                  onClick={() => !isUploading && handleCardClick(doc.id, doc.status)}
                >
                  {isUploading ? (
                    <Loader2 className="h-5.5 w-5.5 text-blue-600 animate-spin" />
                  ) : (
                    <>
                      {doc.status === 'approved' && <Icon i="check-circle" size={18} className="text-green-600 dark:text-green-400" />}
                      {doc.status === 'pending' && <Icon i="clock" size={18} className="text-amber-600 dark:text-amber-400" />}
                      {doc.status === 'upload' && <Icon i="upload" size={18} className="text-blue-600 dark:text-blue-400" />}
                    </>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
            accept=".jpg,.jpeg,.png,.pdf" 
          />

          {/* Security notice */}
          <div className="bg-secondary rounded-xl px-4 py-3 flex items-center gap-3">
            <Icon i="shield-check" size={22} className="text-primary" />
            <p className="text-xs text-primary flex-1" style={{ fontWeight: 500 }}>
              Your documents are encrypted and securely stored.
            </p>
          </div>

          {/* Submit button */}
          <VendorButton onClick={() => navigate('/kyc/review')}>Continue to Review</VendorButton>

        </div>
      </div>
    </div>
  );
}
