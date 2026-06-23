import { Link } from "react-router-dom";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: "var(--color-dark)",
      color: "var(--color-text-inverse)",
      paddingTop: 48,
    }}>
      <div className="container">
        {/* Top Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 40,
          paddingBottom: 40,
          borderBottom: "1px solid var(--color-border-dark)",
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
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
                <span style={{ color: "var(--color-primary-light)" }}>Flow</span>Mart
              </span>
            </div>
            <p style={{
              fontSize: "0.813rem",
              color: "var(--color-text-light)",
              lineHeight: 1.6,
              maxWidth: 260,
            }}>
              Your one-stop marketplace for everything you need, delivered fast to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--color-text-inverse)",
            }}>
              Quick Links
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/" style={footerLinkStyle}>Home</Link>
              <Link to="/products" style={footerLinkStyle}>All Products</Link>
              <Link to="/cart" style={footerLinkStyle}>My Cart</Link>
              <Link to="/orders" style={footerLinkStyle}>My Orders</Link>
              <Link to="/profile" style={footerLinkStyle}>My Profile</Link>
            </div>
          </div>

          {/* For Business */}
          <div>
            <h4 style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--color-text-inverse)",
            }}>
              For Business
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link to="/get-started" style={footerLinkStyle}>Sell on FlowMart</Link>
              <Link to="/get-started" style={footerLinkStyle}>Become a Rider</Link>
              <Link to="/vendor/dashboard" style={footerLinkStyle}>Vendor Dashboard</Link>
              <Link to="/rider/dashboard" style={footerLinkStyle}>Rider Dashboard</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--color-text-inverse)",
            }}>
              Contact Us
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="mailto:support@flowmart.com" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <Mail size={16} style={{ color: "var(--color-primary-light)", flexShrink: 0 }} />
                <span style={footerLinkStyle}>support@flowmart.com</span>
              </a>
              <a href="tel:+2348000000000" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <Phone size={16} style={{ color: "var(--color-primary-light)", flexShrink: 0 }} />
                <span style={footerLinkStyle}>+234 800 000 0000</span>
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MapPin size={16} style={{ color: "var(--color-primary-light)", flexShrink: 0 }} />
                <span style={footerLinkStyle}>Lagos, Nigeria</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>
            © {new Date().getFullYear()} FlowMart. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link to="/terms" style={{ fontSize: "0.75rem", color: "var(--color-text-light)", textDecoration: "none" }}>Terms</Link>
            <Link to="/privacy" style={{ fontSize: "0.75rem", color: "var(--color-text-light)", textDecoration: "none" }}>Privacy</Link>
            <Link to="/cookies" style={{ fontSize: "0.75rem", color: "var(--color-text-light)", textDecoration: "none" }}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const footerLinkStyle: React.CSSProperties = {
  fontSize: "0.813rem",
  color: "var(--color-text-light)",
  transition: "color 200ms ease",
  textDecoration: "none",
};

export default Footer;
