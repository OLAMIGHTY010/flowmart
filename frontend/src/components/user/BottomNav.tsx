import { NavLink } from "react-router-dom";
import { Home, Package, ShoppingBag, Truck, Bell, User } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";

export default function BottomNav() {
  const cartCount = useCartStore((s) => s.getCartCount());
  const { user } = useAuth();

  const getNavItems = () => {
    const role = user?.role;
    
    // Default / Shopper items
    let items = [
      { label: "Home", icon: Home, path: "/" },
      { label: "Orders", icon: Package, path: "/orders" },
      { label: "Marketplace", icon: ShoppingBag, path: "/products" },
    ];

    if (role === "dispatch_rider") {
      items = [
        { label: "Home", icon: Home, path: "/rider/dashboard" },
        { label: "Deliveries", icon: Truck, path: "/rider/deliveries" },
        { label: "Marketplace", icon: ShoppingBag, path: "/products" },
      ];
    } else if (role === "vendor") {
      items = [
        { label: "Home", icon: Home, path: "/vendor/dashboard" },
        { label: "Orders", icon: Package, path: "/vendor/orders" },
        { label: "Marketplace", icon: ShoppingBag, path: "/products" },
      ];
    }

    // Add Alerts and Profile for all roles
    items.push({ label: "Alerts", icon: Bell, path: "/alerts" });
    items.push({ label: "Profile", icon: User, path: "/profile" });

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="mobile-only" style={{
      position: "fixed",
      bottom: "16px",
      left: "16px",
      right: "16px",
      backgroundColor: "var(--color-bg-primary)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 20px",
      zIndex: "var(--z-sticky)" as unknown as number,
      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      borderRadius: "24px",
      border: "1px solid var(--color-border)",
    }}>
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isCart = item.label === "Cart";

        return (
          <NavLink 
            key={index} 
            to={item.path} 
            className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <div style={{ position: "relative" }}>
              <Icon size={24} />
              {isCart && cartCount > 0 && (
                <span className="badge-indicator">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <style>{`
        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          color: var(--color-text-muted);
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.3px;
          transition: color var(--transition-fast), transform var(--transition-fast);
        }
        .bottom-nav-item.active {
          color: var(--color-primary);
          transform: translateY(-2px);
        }
        .badge-indicator {
          position: absolute;
          top: -4px;
          right: -8px;
          background-color: var(--color-accent-red);
          color: white;
          font-size: 0.55rem;
          font-weight: 800;
          padding: 2px 4px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--color-bg-primary);
          min-width: 16px;
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
