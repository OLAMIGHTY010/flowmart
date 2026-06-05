import React from 'react';
import MobileStatusBar from '@/components/MobileStatusBar';
import { VendorButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import VendorProgressBar from '@/components/VendorProgressBar';
import Icon from '@/components/Icon';
import SideBanner from '@/components/SideBanner';

export default function KYCDocumentsScreen() {
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
            <button className="w-8 h-8 rounded-full bg-input flex items-center justify-center">
              <Icon i="arrow-left" size={16} />
            </button>
            <div>
              <h2 className="text-xl font-headings text-foreground" style={{ fontWeight: 800 }}>
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

          {/* Required Documents */}
          <p className="text-sm font-body text-foreground" style={{ fontWeight: 700 }}>Required Documents</p>
          <div className="flex flex-col gap-3">
            <Card title="National ID / Passport" status="approved" subtitle="Government-issued photo ID" />
            <Card title="Proof of Address" status="approved" subtitle="Utility bill or bank statement" />
            <Card title="CAC Certificate" status="pending" subtitle="Business registration document" />
            <Card title="Bank Statement" status="upload" subtitle="Last 3 months statement" />
          </div>

          {/* Security notice */}
          <div className="bg-secondary rounded-xl px-4 py-3 flex items-center gap-3">
            <Icon i="shield-check" size={22} className="text-primary" />
            <p className="text-xs text-primary flex-1" style={{ fontWeight: 500 }}>
              Your documents are encrypted and securely stored.
            </p>
          </div>

          {/* Submit button */}
          <VendorButton>Submit Documents</VendorButton>
        </div>
      </div>
    </div>
  );
}
