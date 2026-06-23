import { Link } from "react-router-dom";
import {
  ShoppingBag, Truck, Apple, Shirt, Home as HomeIcon,
  Heart, Sparkles, Monitor, ArrowRight, Star, ChevronRight,
  Store, Users, Package, Zap
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   FlowMart Homepage
   Sections: Hero → Categories → Featured Products →
   Promo Banner → Delivery CTA → Top Vendors → Sell CTA
   ═══════════════════════════════════════════════════════ */

const categories = [
  { name: "Groceries", icon: Apple, color: "var(--color-primary)" },
  { name: "Electronics", icon: Monitor, color: "var(--color-accent-blue)" },
  { name: "Fashion", icon: Shirt, color: "var(--color-accent-orange)" },
  { name: "Home", icon: HomeIcon, color: "var(--color-primary-hover)" },
  { name: "Health", icon: Heart, color: "var(--color-accent-red)" },
  { name: "Beauty", icon: Sparkles, color: "var(--color-accent-amber)" },
];

const featuredProducts = [
  { id: "1", name: "Fresh Tomatoes", price: 1200, rating: 4.5, image: "🍅", vendor: "Farm Fresh NG" },
  { id: "2", name: "Organic Peppers", price: 800, rating: 4.8, image: "🌶️", vendor: "Green Basket" },
  { id: "3", name: "Premium Rice 5kg", price: 7500, rating: 4.6, image: "🍚", vendor: "Grain Master" },
  { id: "4", name: "Fresh Avocados", price: 2000, rating: 4.7, image: "🥑", vendor: "Fruit Palace" },
  { id: "5", name: "Local Honey 500ml", price: 3500, rating: 4.9, image: "🍯", vendor: "Bee Natural" },
  { id: "6", name: "Plantain Bunch", price: 1500, rating: 4.4, image: "🍌", vendor: "Farm Fresh NG" },
];

const topVendors = [
  { name: "Farm Fresh NG", category: "Groceries & Produce", rating: 4.8, products: 156 },
  { name: "TechZone", category: "Electronics & Gadgets", rating: 4.7, products: 89 },
  { name: "Style Hub", category: "Fashion & Apparel", rating: 4.6, products: 234 },
  { name: "Green Basket", category: "Organic Foods", rating: 4.9, products: 67 },
];

const Homepage = () => {
  return (
    <div>
      {/* ═══ HERO SECTION ═══ */}
      <section style={{
        position: "relative",
        minHeight: 420,
        display: "flex",
        alignItems: "center",
        background: `linear-gradient(135deg, var(--color-bg-overlay) 0%, rgba(5, 46, 22, 0.85) 100%), url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=80') center/cover no-repeat`,
        overflow: "hidden",
      }}>
        <div className="container" style={{
          position: "relative",
          zIndex: 2,
          padding: "60px 24px",
        }}>
          {/* Tag */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            borderRadius: "var(--radius-full)",
            marginBottom: 16,
          }}>
            <Zap size={14} style={{ color: "var(--color-primary-lighter)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-primary-lighter)" }}>
              Free delivery on your first order
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: 800,
            color: "var(--color-text-inverse)",
            lineHeight: 1.15,
            maxWidth: 560,
            marginBottom: 16,
          }}>
            Anything You Need,{" "}
            <span style={{ color: "var(--color-primary-lighter)" }}>Delivered Fast.</span>
          </h1>

          <p style={{
            fontSize: "1rem",
            color: "rgba(255, 255, 255, 0.8)",
            maxWidth: 440,
            lineHeight: 1.6,
            marginBottom: 28,
          }}>
            Shop thousands of products from trusted vendors and get them delivered to your doorstep in minutes.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/get-started" className="btn-primary" style={{
              padding: "14px 32px",
              fontSize: "1rem",
              borderRadius: "var(--radius-xl)",
              backgroundColor: "var(--color-primary-light)",
            }}>
              <ShoppingBag size={18} />
              Start Shopping
            </Link>
            <Link to="/get-started" className="btn-secondary" style={{
              padding: "14px 32px",
              fontSize: "1rem",
              borderRadius: "var(--radius-xl)",
              backgroundColor: "transparent",
              color: "var(--color-text-inverse)",
              borderColor: "rgba(255,255,255,0.4)",
            }}>
              <Truck size={18} />
              Become a Rider
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: 32,
            marginTop: 40,
            flexWrap: "wrap",
          }}>
            {[
              { label: "Active Vendors", value: "500+" },
              { label: "Products", value: "10K+" },
              { label: "Deliveries", value: "50K+" },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-inverse)" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section style={{
        backgroundColor: "var(--color-bg-primary)",
        borderBottom: "1px solid var(--color-border-light)",
      }}>
        <div className="container" style={{ padding: "28px 24px" }}>
          <p style={{
            fontSize: "0.813rem",
            color: "var(--color-text-muted)",
            marginBottom: 16,
            fontWeight: 500,
          }}>
            Shop by Category
          </p>
          <div style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 4,
          }}>
            {categories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to="/"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 80,
                    padding: "14px 8px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-bg-primary)",
                    transition: "all var(--transition-base)",
                    textAlign: "center",
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-bg-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <IconComp size={22} style={{ color: cat.color }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ═══ */}
      <section className="section" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <div className="container">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}>
            <div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Featured Products
              </h2>
              <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                Popular items from top vendors
              </p>
            </div>
            <Link to="/" style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-primary)",
            }}>
              See all <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
          }}>
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="card"
                style={{
                  overflow: "hidden",
                  textDecoration: "none",
                }}
              >
                {/* Image placeholder */}
                <div style={{
                  height: 140,
                  backgroundColor: "var(--color-bg-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                }}>
                  {product.image}
                </div>
                <div style={{ padding: "12px" }}>
                  <p style={{
                    fontSize: "0.813rem",
                    color: "var(--color-text-muted)",
                    marginBottom: 2,
                  }}>
                    {product.vendor}
                  </p>
                  <h3 style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginBottom: 6,
                  }}>
                    {product.name}
                  </h3>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{
                      fontSize: "0.938rem",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                    }}>
                      ₦{product.price.toLocaleString()}
                    </span>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}>
                      <Star size={13} style={{ color: "var(--color-accent-amber)", fill: "var(--color-accent-amber)" }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {product.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROMO BANNER — 30% OFF ═══ */}
      <section style={{
        backgroundColor: "var(--color-primary)",
        padding: "40px 0",
      }}>
        <div className="container" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}>
          <h2 style={{
            fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
            fontWeight: 700,
            color: "var(--color-text-inverse)",
            marginBottom: 8,
          }}>
            Up to 30% off{" "}
            <span style={{
              color: "var(--color-primary-lighter)",
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}>
              selected items
            </span>
          </h2>
          <p style={{
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.8)",
            marginBottom: 20,
          }}>
            Limited time offers on groceries, electronics, and more
          </p>
          <Link to="/" className="btn-primary" style={{
            backgroundColor: "var(--color-text-inverse)",
            color: "var(--color-primary)",
            padding: "12px 28px",
            borderRadius: "var(--radius-full)",
          }}>
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ═══ DELIVERY CTA — "Bet We Can" ═══ */}
      <section style={{
        backgroundColor: "var(--color-dark)",
        padding: "56px 0",
      }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{
            fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
            fontWeight: 700,
            color: "var(--color-text-inverse)",
            marginBottom: 8,
          }}>
            Think We Can't Deliver It?{" "}
            <span style={{ color: "var(--color-accent-amber)" }}>Bet We Can.</span>
          </h2>
          <p style={{
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.7)",
            maxWidth: 500,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}>
            From fragile electronics to fresh farm produce — our verified riders deliver anything, anywhere, carefully.
          </p>

          {/* Delivery stats */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 8,
          }}>
            {[
              { icon: Package, label: "Same-day delivery" },
              { icon: Truck, label: "Real-time tracking" },
              { icon: Users, label: "Verified riders" },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 20px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--color-bg-dark-card)",
                    border: "1px solid var(--color-border-dark)",
                  }}
                >
                  <IconComp size={18} style={{ color: "var(--color-primary-light)" }} />
                  <span style={{ fontSize: "0.813rem", color: "var(--color-text-inverse)", fontWeight: 500 }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TOP VENDORS ═══ */}
      <section className="section">
        <div className="container">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}>
            <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Top Vendors
            </h2>
            <Link to="/" style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-primary)",
            }}>
              View all <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}>
            {topVendors.map((vendor) => (
              <div key={vendor.name} className="card" style={{ padding: 20 }}>
                {/* Vendor avatar */}
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--color-primary-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}>
                  <Store size={24} style={{ color: "var(--color-primary)" }} />
                </div>

                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: 2,
                }}>
                  {vendor.name}
                </h3>
                <p style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginBottom: 12,
                }}>
                  {vendor.category}
                </p>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={14} style={{ color: "var(--color-accent-amber)", fill: "var(--color-accent-amber)" }} />
                    <span style={{ fontSize: "0.813rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {vendor.rating}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {vendor.products} products
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SELL ON FLOWMART CTA ═══ */}
      <section style={{
        backgroundColor: "var(--color-bg-secondary)",
        padding: "48px 0",
      }}>
        <div className="container">
          <div style={{
            backgroundColor: "var(--color-bg-primary)",
            borderRadius: "var(--radius-xl)",
            padding: "40px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            flexWrap: "wrap",
            border: "1px solid var(--color-border)",
          }}>
            <div>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-primary)",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}>
                Become a Vendor
              </span>
              <h2 style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                marginTop: 4,
                marginBottom: 4,
              }}>
                Sell on FlowMart
              </h2>
              <p style={{
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
              }}>
                Reach 2,000,000+ buyers across Nigeria
              </p>
            </div>
            <Link to="/get-started" className="btn-primary" style={{
              padding: "14px 32px",
              borderRadius: "var(--radius-xl)",
            }}>
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
