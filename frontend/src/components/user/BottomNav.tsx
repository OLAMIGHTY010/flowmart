import { NavLink } from "react-router-dom";
import { Home, Package, ShoppingBag, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

export default function BottomNav() {
  const cartCount = useCartStore((s) => s.getCartCount());

  return (
    <nav className="mobile-only" style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "var(--color-bg-primary)",
      borderTop: "1px solid var(--color-border)",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "8px 12px",
      paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      zIndex: "var(--z-sticky)" as any,
      boxShadow: "0 -4px 12px rgba(0,0,0,0.05)"
    }}>
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
        <Home size={22} />
        <span>HOME</span>
      </NavLink>

      <NavLink to="/products" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
        <Package size={22} />
        <span>PRODUCTS</span>
      </NavLink>

      <NavLink to="/orders" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
        <ShoppingBag size={22} />
        <span>ORDERS</span>
      </NavLink>

      <NavLink to="/cart" className="bottom-nav-fab">
        <div className="fab-button">
          <ShoppingCart size={24} style={{ color: "white" }} />
          {cartCount > 0 && (
            <span className="fab-badge">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>
        <span>CART</span>
      </NavLink>

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
          letter-spacing: 0.5px;
          transition: color var(--transition-fast);
        }
        .bottom-nav-item.active {
          color: var(--color-primary);
        }
        .bottom-nav-fab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          color: var(--color-text-muted);
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          position: relative;
        }
        .fab-button {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background-color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -24px;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
          position: relative;
        }
        .fab-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background-color: var(--color-accent-red);
          color: white;
          font-size: 0.625rem;
          font-weight: 800;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--color-bg-primary);
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
