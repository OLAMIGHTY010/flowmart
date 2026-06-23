import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { User, Mail, Phone, LogOut, Save } from "lucide-react";

const Profile = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, call API to update profile here
    showToast("Profile updated successfully", "success");
  };

  return (
    <div className="container" style={{ padding: "32px 24px", minHeight: "70vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            My Profile
          </h1>
          <button onClick={logout} className="btn-secondary" style={{ color: "var(--color-accent-red)", borderColor: "var(--color-accent-red)" }}>
            <LogOut size={16} />
            Log Out
          </button>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "var(--color-primary-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-primary)"
            }}>
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 4 }}>{user?.fullName}</h2>
              <span className="badge badge-green" style={{ textTransform: "capitalize" }}>{user?.role.replace("_", " ")} Account</span>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
                placeholder="+234..."
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
