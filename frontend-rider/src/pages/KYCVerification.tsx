import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useKYCStatus } from '@/hooks/useRiderQueries';
import { VendorButton } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/Icon';
import SideBanner from '@/components/SideBanner';
import { Loader2 } from 'lucide-react';

export default function KYCVerification() {
  const navigate = useNavigate();
  const { data: kycStatus, isLoading, refetch } = useKYCStatus({ refetchInterval: 10000 }); // poll every 10s

  const status = kycStatus?.status || 'under_review';

  // Navigate directly if approved and they are on this screen
  useEffect(() => {
    if (status === 'approved') {
      // Small delay for UI smoothness
      const t = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto w-full">
        <div className="w-full max-w-md flex flex-col items-center">
          
          {/* Header */}
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <Icon i="check" size={48} className="text-emerald-700 stroke-[3]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-headings text-slate-800 leading-tight mb-3 text-center">
            {status === 'approved' ? 'Application Approved!' : 'Application Submitted!'}
          </h2>
          
          <p className="text-sm text-slate-500 leading-relaxed text-center mb-8 max-w-[320px]">
            {status === 'approved' 
              ? "Your account has been fully activated. You are being redirected to your dashboard."
              : "Your FlowMart rider account is under review. We'll notify you within 24-48 hours once your documents are verified and your account is activated."}
          </p>

          <Card className="w-full bg-surface rounded-[24px] border border-slate-100 shadow-sm mb-8 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 relative">
                {/* Vertical connecting line */}
                <div className="absolute left-4 top-4 bottom-8 w-0.5 bg-slate-100 -z-0"></div>

                {/* Step 1: Documents Submitted */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#15803d] flex items-center justify-center shrink-0 border-[3px] border-white">
                    <Icon i="check" size={14} className="text-white" />
                  </div>
                  <div className="pt-1.5">
                    <h4 className="text-sm font-bold text-slate-800">Documents Submitted</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      All required documents have been uploaded successfully.
                    </p>
                  </div>
                </div>

                {/* Step 2: Under Review */}
                <div className="flex items-start gap-4 relative z-10">
                  {status === 'approved' ? (
                    <div className="w-8 h-8 rounded-full bg-[#15803d] flex items-center justify-center shrink-0 border-[3px] border-white">
                      <Icon i="check" size={14} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-600 flex items-center justify-center shrink-0 outline-[3px] outline-white outline">
                      <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div>
                    </div>
                  )}
                  <div className="pt-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">Under Review</h4>
                      {status !== 'approved' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Our team is verifying your identity and account details.
                    </p>
                  </div>
                </div>

                {/* Step 3: Account Activated */}
                <div className="flex items-start gap-4 relative z-10">
                  {status === 'approved' ? (
                    <div className="w-8 h-8 rounded-full bg-[#15803d] flex items-center justify-center shrink-0 border-[3px] border-white">
                      <Icon i="check" size={14} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0 outline-[3px] outline-white outline">
                      <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                    </div>
                  )}
                  <div className="pt-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">Account Activated</h4>
                      {status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      You'll receive access to the rider dashboard once approved.
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="w-full flex flex-col items-center gap-4">
            {status === 'approved' ? (
              <VendorButton 
                onClick={() => navigate('/dashboard')} 
                className="w-full py-6 text-base font-bold bg-[#15803d] hover:bg-[#166534] text-white rounded-[16px]"
              >
                Go to Dashboard
              </VendorButton>
            ) : (
              <VendorButton 
                disabled 
                className="w-full py-6 text-base font-bold bg-[#15803d]/50 text-white rounded-[16px] opacity-70"
              >
                Go to Home
              </VendorButton>
            )}
            
            {status !== 'approved' && (
              <button 
                onClick={() => refetch()}
                className="text-sm font-semibold text-slate-800 hover:text-emerald-700 transition flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                Track Application Status
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
