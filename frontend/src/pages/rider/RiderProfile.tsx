import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { User, Mail, Phone, Save, Bike } from "lucide-react";
import { apiClient } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RiderProfile = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    vehicleType: "motorcycle",
    licensePlate: "LAG-123-XY",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post("/rider/kyc/submit", {
        displayName: formData.fullName,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        plateNumber: formData.licensePlate,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
      });
      showToast("Profile & KYC updated successfully. Pending Admin review.", "success");
      refreshUser();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 24 }}>
        My Profile
      </h1>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "var(--color-primary-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--color-primary)"
          }}>
            {user?.fullName?.charAt(0) || "R"}
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 4 }}>{user?.fullName}</h2>
            <span className="badge badge-green">Verified Rider</span>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              <User size={16} /> Full Name
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              <Mail size={16} /> Email Address <span style={{ fontSize: "0.75rem", color: "var(--color-text-light)", fontWeight: 400 }}>(Read-only via Google)</span>
            </label>
            <input 
              type="email" 
              className="input-field" 
              value={user?.email || ""}
              disabled
              style={{ backgroundColor: "var(--color-bg-tertiary)", cursor: "not-allowed", color: "var(--color-text-muted)" }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              <Phone size={16} /> Phone Number
            </label>
            <input 
              type="tel" 
              className="input-field" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "8px 0" }} />
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 8 }}>Vehicle Details</h3>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              <Bike size={16} /> Vehicle Type
            </label>
            <Select value={formData.vehicleType} onValueChange={(val) => setFormData({ ...formData, vehicleType: val })}>
              <SelectTrigger className="w-full bg-input border-border rounded-xl px-4 py-3 h-[46px]">
                <SelectValue placeholder="Select Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                <SelectItem value="bicycle">Bicycle</SelectItem>
                <SelectItem value="car">Car</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              License Plate Number
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
            />
          </div>

          <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "8px 0" }} />
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 8 }}>Payout Details</h3>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              Bank Name
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="E.g. GTBank"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              Account Number
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="0123456789"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text-secondary)" }}>
              Account Name
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={isSubmitting}>
              <Save size={18} />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiderProfile;
