import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cartCount = useCartStore((s) => s.getCartCount());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav style={{
      backgroundColor: "var(--color-dark)",
      position: "sticky",
      top: 0,
      zIndex: "var(--z-sticky)" as any,
    }}>
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        height: 64,
      }}>
        {/* Logo */}
        <Link to="/products" style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          textDecoration: "none"
        }}>
          <img 
            src={logo} 
            alt="FlowMart Logo" 
            style={{
              width: 36,
              height: 36,
              objectFit: "contain",
              borderRadius: "var(--radius-sm)"
            }}
          />
          <span style={{
            fontSize: "1.125rem",
            fontWeight: 800,
            color: "var(--color-primary-light)",
            letterSpacing: "-0.5px"
          }}>
            Flow<span style={{ color: "var(--color-text-inverse)" }}>Mart</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="desktop-only" style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
          marginLeft: 24,
          marginRight: "auto"
        }}>
          <Link to="/" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-inverse)", textDecoration: "none" }}>Home</Link>
          <Link to="/products" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-inverse)", textDecoration: "none" }}>Products</Link>
          <Link to="/orders" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-inverse)", textDecoration: "none" }}>Orders</Link>
        </div>

        {/* Search Bar (Desktop) */}
        <form
          onSubmit={handleSearch}
          style={{
            flex: 1,
            maxWidth: 520,
            display: "flex",
          }}
          className="desktop-only"
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            backgroundColor: "var(--color-bg-primary)",
            borderRadius: "var(--radius-full)",
            padding: "0 4px 0 16px",
            height: 40,
          }}>
            <input
              type="text"
              placeholder="Search products, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.875rem",
                color: "var(--color-text-primary)",
                backgroundColor: "transparent",
              }}
            />
            <button
              type="submit"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Search size={16} style={{ color: "var(--color-text-inverse)" }} />
            </button>
          </div>
        </form>

        {/* Right Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          {/* Cart */}
          <Link
            to="/cart"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-inverse)",
              transition: "background-color var(--transition-fast)",
              position: "relative",
            }}
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "var(--color-accent-red)",
                color: "#fff",
                fontSize: "0.625rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* User / Login */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => navigate("/profile")}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-inverse)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </button>
              <button
                onClick={() => logout()}
                className="desktop-only"
                style={{
                  padding: "8px 20px",
                  backgroundColor: "transparent",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="desktop-only"
              style={{
                padding: "8px 20px",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-text-inverse)",
                borderRadius: "var(--radius-full)",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "background-color var(--transition-fast)",
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="mobile-only" style={{
        padding: "0 16px 12px",
      }}>
        <form onSubmit={handleSearch}>
          <div style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "var(--color-bg-primary)",
            borderRadius: "var(--radius-full)",
            padding: "0 4px 0 14px",
            height: 38,
          }}>
            <Search size={16} style={{ color: "var(--color-text-light)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.813rem",
                color: "var(--color-text-primary)",
                backgroundColor: "transparent",
                padding: "0 10px",
              }}
            />
          </div>
        </form>
      </div>


      {/* Responsive CSS */}
      <style>{`
        .desktop-only { display: flex; }
        .mobile-only { display: none; }

        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
      `}</style>
    </nav>
  );
};

const menuLinkStyle: React.CSSProperties = {
  padding: "14px 0",
  fontSize: "1rem",
  fontWeight: 500,
  color: "var(--color-text-primary)",
  borderBottom: "1px solid var(--color-border-light)",
};

export default Navbar;
