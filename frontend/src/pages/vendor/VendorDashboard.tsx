import { Link } from "react-router-dom";
import { Package, ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const VendorDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: "Total Revenue", value: "₦450,000", icon: DollarSign, color: "var(--color-primary)" },
    { label: "Active Orders", value: "12", icon: ShoppingCart, color: "var(--color-accent-blue)" },
    { label: "Total Products", value: "45", icon: Package, color: "var(--color-accent-amber)" },
    { label: "Growth", value: "+14.5%", icon: TrendingUp, color: "var(--color-primary-lighter)" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Welcome back, {user?.fullName?.split(" ")[0]}!
          </h1>
          <p style={{ color: "var(--color-text-muted)" }}>Here's what's happening with your store today.</p>
        </div>
        <Link to="/vendor/products/new" className="btn-primary">
          <Package size={18} />
          Add Product
        </Link>
      </div>

      {/* KYC Warning if not verified */}
      {!user?.isVerified && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          padding: 20,
          backgroundColor: "#FEF2F2",
          border: "1px solid var(--color-accent-red)",
          borderRadius: "var(--radius-lg)",
          marginBottom: 32,
        }}>
          <AlertTriangle size={24} style={{ color: "var(--color-accent-red)", flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-accent-red)", marginBottom: 4 }}>
              Account Verification Required
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 12 }}>
              Your store is currently hidden from buyers. Complete your KYC verification to start selling.
            </p>
            <Link to="/vendor/kyc" className="btn-secondary" style={{ padding: "8px 16px", borderColor: "var(--color-accent-red)", color: "var(--color-accent-red)" }}>
              Complete KYC
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
        {stats.map((stat) => {
          const IconComp = stat.icon;
          return (
            <div key={stat.label} className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-bg-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <IconComp size={24} style={{ color: stat.color }} />
                </div>
              </div>
              <h3 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
                {stat.value}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Table Placeholder */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Recent Orders</h2>
          <Link to="/vendor/orders" style={{ fontSize: "0.875rem", color: "var(--color-primary)", fontWeight: 600 }}>
            View All
          </Link>
        </div>
        <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
          <ShoppingCart size={40} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
          <p>No recent orders found.</p>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
