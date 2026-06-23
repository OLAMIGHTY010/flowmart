import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Bike, Package, Wallet, Settings, LogOut, Bell, Menu } from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/rider/dashboard", label: "Home", icon: Bike },
  { path: "/rider/deliveries", label: "Deliveries", icon: Package },
  { path: "/rider/earnings", label: "Earnings", icon: Wallet },
  { path: "/rider/profile", label: "Profile", icon: Settings },
];

const RiderLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "var(--color-bg-secondary)" }}>
      
      {/* ═══ TOPBAR (Mobile & Desktop) ═══ */}
      <header style={{
        height: 64,
        backgroundColor: "var(--color-bg-primary)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        position: "sticky",
        top: 0,
        zIndex: "var(--z-sticky)" as any,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "var(--color-primary-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          }}>
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || 'Rider'}&backgroundColor=15803D&textColor=ffffff`} 
              alt="Profile" 
              style={{ width: "100%", height: "100%" }} 
            />
          </div>
          <div className="desktop-only">
            <p style={{ fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.2 }}>{user?.fullName}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Online & Ready</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{ position: "relative", color: "var(--color-text-primary)" }}>
            <Bell size={22} />
            <span style={{
              position: "absolute", top: -2, right: -2, width: 10, height: 10,
              backgroundColor: "var(--color-accent-red)", borderRadius: "50%", border: "2px solid var(--color-bg-primary)"
            }} />
          </button>
          
          <button className="desktop-only" onClick={logout} style={{ color: "var(--color-accent-red)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", fontWeight: 600 }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <main style={{ flex: 1, paddingBottom: 80, display: "flex", flexDirection: "column" }}>
        <div className="container" style={{ padding: "20px 16px", maxWidth: 800 }}>
          <Outlet />
        </div>
      </main>

      {/* ═══ BOTTOM NAVIGATION (Mobile Only) ═══ */}
      <nav className="bottom-nav mobile-only" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--color-bg-primary)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 8px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        zIndex: "var(--z-sticky)" as any,
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComp = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                transition: "color var(--transition-fast)",
              }}
            >
              <div style={{
                padding: "6px 16px",
                borderRadius: "var(--radius-full)",
                backgroundColor: isActive ? "var(--color-primary-surface)" : "transparent",
                transition: "background-color var(--transition-fast)",
              }}>
                <IconComp size={22} style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }} />
              </div>
              <span style={{ fontSize: "0.688rem", fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar instead of Bottom Nav for wider screens */}
      <style>{`
        .mobile-only { display: block; }
        .desktop-only { display: none; }
        
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
          .desktop-only { display: flex !important; }
          
          /* Switch to a left sidebar layout for desktop */
          main { padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default RiderLayout;
