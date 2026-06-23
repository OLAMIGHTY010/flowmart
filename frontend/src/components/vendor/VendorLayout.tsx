import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, Package, ShoppingCart, 
  Settings, LogOut, Menu, X, Leaf,
  UserCheck, ShieldAlert
} from "lucide-react";

const navItems = [
  { path: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/vendor/products", label: "My Products", icon: Package },
  { path: "/vendor/orders", label: "Orders", icon: ShoppingCart },
  { path: "/vendor/kyc", label: "KYC Verification", icon: ShieldAlert },
  { path: "/vendor/settings", label: "Settings", icon: Settings },
];

const VendorLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-bg-secondary)" }}>
      
      {/* ═══ SIDEBAR (Desktop: fixed, Mobile: off-canvas) ═══ */}
      <aside className={`vendor-sidebar ${sidebarOpen ? "open" : ""}`} style={{
        width: 260,
        backgroundColor: "var(--color-dark)",
        color: "var(--color-text-inverse)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: "var(--z-modal)" as any,
        transition: "transform var(--transition-base)",
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border-dark)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/vendor/dashboard" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Leaf size={18} style={{ color: "var(--color-text-inverse)" }} />
            </div>
            <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary-light)" }}>Vendor</span>Portal
            </span>
          </Link>
          
          <button className="mobile-only" onClick={() => setSidebarOpen(false)} style={{ color: "var(--color-text-light)" }}>
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComp = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                  color: isActive ? "var(--color-text-inverse)" : "var(--color-text-light)",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all var(--transition-fast)",
                }}
              >
                <IconComp size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: "20px 16px", borderTop: "1px solid var(--color-border-dark)" }}>
          <button 
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              width: "100%",
              color: "var(--color-accent-red)",
              fontWeight: 500,
              borderRadius: "var(--radius-md)",
              transition: "background-color var(--transition-fast)",
            }}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-only"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: ("var(--z-modal)" as any) - 1,
          }} 
        />
      )}

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <main style={{ flex: 1, marginLeft: 260, display: "flex", flexDirection: "column" }} className="vendor-main">
        {/* Topbar */}
        <header style={{
          height: 70,
          backgroundColor: "var(--color-bg-primary)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: "var(--z-sticky)" as any,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="mobile-only" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} style={{ color: "var(--color-text-primary)" }} />
            </button>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)" }} className="desktop-only">
              {navItems.find(i => i.path === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }} className="desktop-only">
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{user?.fullName}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Vendor ID: #{user?.id?.substring(0, 6)}</p>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "var(--color-primary-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)",
                fontWeight: 600,
              }}>
                {user?.fullName?.charAt(0) || "V"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: "32px 24px", flex: 1 }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        .mobile-only { display: none; }
        
        @media (max-width: 1024px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: block; }
          
          .vendor-main {
            margin-left: 0 !important;
          }
          
          .vendor-sidebar {
            transform: translateX(-100%);
          }
          
          .vendor-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default VendorLayout;
