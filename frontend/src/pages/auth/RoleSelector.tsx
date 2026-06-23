import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag, Bike, Store, Leaf, CheckCircle2, ArrowRight } from "lucide-react";

type RoleOption = "attendee" | "dispatch_rider" | "vendor";

const roles: { key: RoleOption; label: string; description: string; icon: typeof ShoppingBag; badge?: string }[] = [
  {
    key: "attendee",
    label: "Order Online",
    description: "Browse products and get deliveries right to your doorstep.",
    icon: ShoppingBag,
    badge: "Most Popular",
  },
  {
    key: "dispatch_rider",
    label: "I'm a Rider",
    description: "Pick up and deliver orders, earn money on your schedule.",
    icon: Bike,
  },
  {
    key: "vendor",
    label: "I'm a Vendor",
    description: "List your products, manage inventory and grow your business.",
    icon: Store,
    badge: "Earn More",
  },
];

const RoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState<RoleOption>("attendee");
  const navigate = useNavigate();

  const handleContinue = () => {
    localStorage.setItem("selectedRole", selectedRole);
    navigate("/login");
  };

  const roleLabels: Record<RoleOption, string> = {
    attendee: "Buyer",
    dispatch_rider: "Rider",
    vendor: "Vendor",
  };

  return (
    <div className="login-container">
      {/* ═══ LEFT PANEL: Brand / Visuals (Hidden on mobile) ═══ */}
      <div className="login-visual-panel">
        <div className="overlay" />
        
        <div className="content">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 60 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Leaf size={24} style={{ color: "var(--color-text-inverse)" }} />
            </div>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-inverse)" }}>
              Flow<span style={{ color: "var(--color-primary-lighter)" }}>Mart</span>
            </span>
          </Link>

          <h1 style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "var(--color-text-inverse)",
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 480,
          }}>
            Join the ecosystem of <span style={{ color: "var(--color-primary-lighter)" }}>fast</span> deliveries.
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "Join 500+ top vendors",
              "Become part of our fast rider network",
              "Shop from 10,000+ available products"
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CheckCircle2 size={20} style={{ color: "var(--color-primary-lighter)" }} />
                <span style={{ fontSize: "1rem", color: "rgba(255, 255, 255, 0.9)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Form Area ═══ */}
      <div className="login-form-panel">
        <div className="form-wrapper">
          
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
            <Link
              to="/login"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
              }}
              className="back-link"
            >
              Sign In Instead
            </Link>
          </div>

          {/* Mobile Logo (Only visible on small screens) */}
          <div className="mobile-logo" style={{ display: "none", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Leaf size={20} style={{ color: "var(--color-text-inverse)" }} />
            </div>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              FlowMart
            </span>
          </div>

          <div>
            <h2 style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}>
              How are you joining?
            </h2>
            <p style={{
              fontSize: "1rem",
              color: "var(--color-text-muted)",
              marginBottom: 32,
            }}>
              Pick a role to get started. You can change this later.
            </p>

            {/* Role Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {roles.map((role) => {
                const isSelected = selectedRole === role.key;
                const IconComp = role.icon;

                return (
                  <button
                    key={role.key}
                    onClick={() => setSelectedRole(role.key)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      padding: "20px 16px",
                      borderRadius: "var(--radius-xl)",
                      border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                      backgroundColor: isSelected ? "var(--color-primary-surface)" : "var(--color-bg-primary)",
                      textAlign: "left",
                      transition: "all var(--transition-base)",
                      cursor: "pointer",
                      position: "relative",
                    }}
                    className="animate-fade-in"
                  >
                    {/* Icon */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: isSelected ? "var(--color-primary)" : "var(--color-bg-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background-color var(--transition-base)",
                    }}>
                      <IconComp
                        size={24}
                        style={{
                          color: isSelected ? "var(--color-text-inverse)" : "var(--color-text-muted)",
                        }}
                      />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: "1.063rem",
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                        }}>
                          {role.label}
                        </span>
                        {role.badge && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold ${role.key === "attendee" ? "bg-orange-500 text-white" : "bg-[#e6f4ea] text-brand-primary"}`}>
                            {role.badge}
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                        lineHeight: 1.4,
                      }}>
                        {role.description}
                      </p>
                    </div>

                    {/* Radio indicator */}
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                      transition: "border-color var(--transition-base)",
                    }}>
                      {isSelected && (
                        <div style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: "var(--color-primary)",
                        }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              className="w-full py-4 px-7 text-[1.063rem] rounded-xl flex items-center justify-center gap-2 bg-brand-primary text-white hover:bg-green-700 transition-colors"
              onClick={handleContinue}
            >
              Continue as {roleLabels[selectedRole]} <ArrowRight size={18} />
            </button>
          </div>
          
          <p style={{
            marginTop: "auto",
            paddingTop: 48,
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
          }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .login-container {
          display: grid;
          min-height: 100vh;
          grid-template-columns: 1fr;
        }

        .login-visual-panel {
          display: none;
          position: relative;
          background: url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80') center/cover no-repeat;
        }

        .login-visual-panel .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(5, 46, 22, 0.9) 0%, rgba(21, 128, 61, 0.8) 100%);
        }

        .login-visual-panel .content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 60px;
        }

        .login-form-panel {
          display: flex;
          flex-direction: column;
          background-color: var(--color-bg-primary);
        }

        .form-wrapper {
          width: 100%;
          max-width: 520px;
          margin: auto;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 100vh;
        }

        .back-link:hover {
          color: var(--color-text-primary) !important;
        }

        @media (min-width: 1024px) {
          .login-container {
            grid-template-columns: 1.1fr 1fr;
          }
          
          .login-visual-panel {
            display: block;
          }
          
          .form-wrapper {
            min-height: auto;
            padding: 60px;
          }
        }
        
        @media (max-width: 1023px) {
          .mobile-logo {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RoleSelector;
