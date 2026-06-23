import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Truck, Apple, Shirt, Home as HomeIcon,
  Heart, Sparkles, Monitor, ArrowRight, Star, ChevronRight,
  Store, Users, Package, Zap, Loader2
} from "lucide-react";
import { apiClient } from "@/services/api";

/* ═══════════════════════════════════════════════════════
   FlowMart Homepage
   Sections: Hero → Categories → Featured Products →
   Promo Banner → Delivery CTA → Sell CTA
   ═══════════════════════════════════════════════════════ */

// Icon mapping for categories that come from the backend
const categoryIconMap: Record<string, any> = {
  "groceries": Apple,
  "electronics": Monitor,
  "phones & tablets": Monitor, // adding specific fallback
  "fashion": Shirt,
  "home, furniture and appliances": HomeIcon,
  "health": Heart,
  "beauty": Sparkles,
};

const categoryColorMap: Record<string, string> = {
  "groceries": "#15803d",
  "electronics": "#2563eb",
  "phones & tablets": "#2563eb",
  "fashion": "#ea580c",
  "home, furniture and appliances": "#0d9488",
  "health": "#dc2626",
  "beauty": "#d97706",
};

const Homepage = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Fetch products from backend — filtered by category, paginated
  const { data: productsData, isLoading: productsLoading, isFetching } = useQuery({
    queryKey: ["homepage-products", activeCategory, page],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
      if (activeCategory && activeCategory !== "All") {
        params.set("category", activeCategory);
      }
      return apiClient.get<{ success: boolean; products: any[]; meta: any }>(`/products?${params.toString()}`);
    },
    placeholderData: (prev) => prev, // keep previous data while loading next page
  });

  // Fetch categories from backend
  const { data: categoriesData } = useQuery({
    queryKey: ["homepage-categories"],
    queryFn: () => apiClient.get<{ success: boolean; categories: string[] }>("/products/categories"),
  });

  const products = productsData?.products || [];
  const totalProducts = productsData?.meta?.total || 0;
  const hasMore = products.length >= LIMIT && (page * LIMIT) < totalProducts;
  const categories = (categoriesData?.categories || []).filter((c: string) => c !== "All");

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setPage(1); // Reset to page 1 when switching categories
  };

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

      {/* ═══ CATEGORIES — Jiji-style horizontal strip ═══ */}
      <section style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid var(--color-border-light)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div className="container" style={{ padding: "0 24px" }}>
          <div style={{
            display: "flex",
            gap: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}>
            {["All", ...(categories.length > 0 ? categories : ["Groceries", "Phones & Tablets", "Electronics", "Fashion", "Home, Furniture and Appliances", "Health", "Beauty"])].map((cat: string) => {
              const key = cat.toLowerCase();
              const IconComp = key === "all" ? ShoppingBag : categoryIconMap[key] || ShoppingBag;
              const color = key === "all" ? "#475569" : categoryColorMap[key] || "#15803d";
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 20px",
                    whiteSpace: "nowrap",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: isActive ? color : "#475569",
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${isActive ? color : "transparent"}`,
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = color;
                      e.currentTarget.style.borderBottomColor = color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#475569";
                      e.currentTarget.style.borderBottomColor = "transparent";
                    }
                  }}
                >
                  <IconComp size={16} style={{ color: isActive ? color : "#475569" }} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ ALL PRODUCTS (from backend) ═══ */}
      <section className="section" id="products-section" style={{ backgroundColor: "var(--color-bg-secondary)", minHeight: "60vh" }}>
        <div className="container">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}>
            <div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {activeCategory === "All" ? "All Products" : `${activeCategory} Products`}
              </h2>
              <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                Shop the best items from our vendors
              </p>
            </div>
          </div>

          {productsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <Loader2 size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : products.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px 24px",
              backgroundColor: "var(--color-bg-primary)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border)",
            }}>
              <Store size={40} style={{ color: "var(--color-text-muted)", marginBottom: 12 }} />
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
                No Products Yet
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 16 }}>
                Vendors are setting up shop. Check back soon!
              </p>
              <Link to="/get-started" className="btn-primary" style={{ padding: "10px 24px" }}>
                Become a Vendor <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 16,
            }}>
              {products.map((product: any) => {
                const firstImage = product.images?.split(",")[0];
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="card"
                    style={{
                      overflow: "hidden",
                      textDecoration: "none",
                    }}
                  >
                    {/* Product image */}
                    <div style={{
                      height: 140,
                      backgroundColor: "var(--color-bg-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}>
                      {firstImage ? (
                        <img
                          src={firstImage.startsWith("http") ? firstImage : `https://flowmart-bucket.s3.amazonaws.com/${firstImage}`}
                          alt={product.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          loading="lazy"
                        />
                      ) : (
                        <ShoppingBag size={32} style={{ color: "var(--color-text-muted)" }} />
                      )}
                    </div>
                    <div style={{ padding: "12px" }}>
                      {product.category && (
                        <p style={{
                          fontSize: "0.6875rem",
                          color: "var(--color-primary)",
                          marginBottom: 2,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}>
                          {product.category}
                        </p>
                      )}
                      <h3 style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        marginBottom: 6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
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
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                        {product.oldPrice && (
                          <span style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            textDecoration: "line-through",
                          }}>
                            ₦{Number(product.oldPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
                className="btn-secondary"
                style={{ padding: "12px 32px", borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", gap: 8 }}
              >
                {isFetching ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ PROMO BANNER ═══ */}
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
          <Link to="/products" className="btn-primary" style={{
            backgroundColor: "var(--color-text-inverse)",
            color: "var(--color-primary)",
            padding: "12px 28px",
            borderRadius: "var(--radius-full)",
            textDecoration: "none",
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
                Reach thousands of buyers across Nigeria
              </p>
            </div>
            <Link to="/get-started" className="btn-primary" style={{
              padding: "14px 32px",
              borderRadius: "var(--radius-xl)",
              textDecoration: "none",
            }}>
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Spin keyframe for loader */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Homepage;
