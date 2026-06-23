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
              Categories
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Groceries", "Electronics", "Fashion", "Home & Kitchen", "Health & Beauty"].map((item) => (
                <Link key={item} to="/" style={footerLinkStyle}>{item}</Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--color-text-inverse)",
            }}>
              Support
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Help Center", "Delivery Info", "Returns Policy", "Terms of Service", "Privacy Policy"].map((item) => (
                <Link key={item} to="/" style={footerLinkStyle}>{item}</Link>
              ))}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Mail size={16} style={{ color: "var(--color-primary-light)", flexShrink: 0 }} />
                <span style={footerLinkStyle}>support@flowmart.com</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Phone size={16} style={{ color: "var(--color-primary-light)", flexShrink: 0 }} />
                <span style={footerLinkStyle}>+234 800 000 0000</span>
              </div>
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
            <Link to="/" style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>Terms</Link>
            <Link to="/" style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>Privacy</Link>
            <Link to="/" style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>Cookies</Link>
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
};

export default Footer;
