import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { ShieldCheck, Upload, Building, FileText, CheckCircle2 } from "lucide-react";

const VendorKYC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<"pending" | "submitted" | "approved">(
    user?.isVerified ? "approved" : "pending"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setKycStatus("submitted");
      showToast("KYC documents submitted successfully. Pending review.", "success");
      refreshUser(); // In a real app this would refresh the user context to reflect the submitted state
    }, 1500);
  };

  if (kycStatus === "approved") {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "var(--color-primary-surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <ShieldCheck size={40} style={{ color: "var(--color-primary)" }} />
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 12 }}>Account Verified</h2>
        <p style={{ color: "var(--color-text-muted)" }}>Your vendor account is fully verified. You can now add products and receive orders.</p>
      </div>
    );
  }

  if (kycStatus === "submitted") {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle2 size={40} style={{ color: "var(--color-accent-amber)" }} />
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 12 }}>Review in Progress</h2>
        <p style={{ color: "var(--color-text-muted)" }}>We have received your documents. Our team will review them within 24-48 hours. We'll notify you once your store is approved.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
        KYC Verification
      </h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 32 }}>
        To ensure a safe marketplace, we require all vendors to verify their identity and business.
      </p>

      <div className="card" style={{ padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          
          {/* Business Info */}
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Building size={20} style={{ color: "var(--color-primary)" }} /> Business Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Store Name</label>
                <input required type="text" className="input-field" placeholder="E.g., TechZone Gadgets" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Business Address</label>
                <textarea required className="input-field" rows={3} placeholder="Full operational address..." />
              </div>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: "var(--color-border)" }} />

          {/* Document Upload */}
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <FileText size={20} style={{ color: "var(--color-primary)" }} /> Document Upload
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Government Issued ID (NIN, Passport, or Driver's License)</label>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 32, border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-bg-secondary)", cursor: "pointer", transition: "border-color var(--transition-fast)"
                }}>
                  <Upload size={24} style={{ color: "var(--color-text-muted)", marginBottom: 12 }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: 4 }}>Click to upload file</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>PNG, JPG or PDF (Max 5MB)</span>
                  <input type="file" required style={{ display: "none" }} />
                </label>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Proof of Address (Utility bill, bank statement)</label>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: 32, border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-bg-secondary)", cursor: "pointer", transition: "border-color var(--transition-fast)"
                }}>
                  <Upload size={24} style={{ color: "var(--color-text-muted)", marginBottom: 12 }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: 4 }}>Click to upload file</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>PNG, JPG or PDF (Max 5MB)</span>
                  <input type="file" required style={{ display: "none" }} />
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ minWidth: 160 }}>
              {isSubmitting ? "Submitting..." : "Submit Documents"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorKYC;
