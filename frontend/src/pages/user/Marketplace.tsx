import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Loader2, ArrowLeft, Star, ChevronRight } from "lucide-react";
import { apiClient } from "@/services/api";
import ProductCard from "@/components/user/product/ProductCard";

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiClient.get<{ success: boolean; products: any[] }>("/products"),
  });

  const products = data?.products || [];

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  
  // Example dummy vendors for filter
  const vendors = ["FlowMart Official", "Fresh Farms", "TechGadgets", "Everyday Essentials"];

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Category
    if (categoryFilter !== "all") {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    // Price Range
    if (priceMin) result = result.filter(p => Number(p.price) >= Number(priceMin));
    if (priceMax) result = result.filter(p => Number(p.price) <= Number(priceMax));
    
    // Sort
    if (sortBy === "price_asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      // newest
      result.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
    }

    return result;
  }, [products, searchTerm, categoryFilter, sortBy, priceMin, priceMax, ratingFilter, vendorFilter]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setSortBy("newest");
    setPriceMin("");
    setPriceMax("");
    setRatingFilter([]);
    setVendorFilter([]);
    setSearchTerm("");
  };

  const toggleRating = (rating: number) => {
    setRatingFilter(prev => prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]);
  };

  const toggleVendor = (vendor: string) => {
    setVendorFilter(prev => prev.includes(vendor) ? prev.filter(v => v !== vendor) : [...prev, vendor]);
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", paddingBottom: 64 }}>
      <div className="container" style={{ padding: "24px", maxWidth: 1400 }}>
        
        {/* Breadcrumb / Top Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link to="/" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <ArrowLeft size={16} /> Home
          </Link>
          <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", fontWeight: 500 }}>Marketplace</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32, alignItems: "start" }}>
          
          {/* ================= LEFT SIDEBAR ================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }} className="desktop-sidebar">
            
            {/* Categories */}
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Categories</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {categories.map((cat: any) => {
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 16px",
                        backgroundColor: isActive ? "var(--color-primary)" : "transparent",
                        color: isActive ? "#fff" : "var(--color-text-primary)",
                        border: "none",
                        borderRadius: "var(--radius-lg)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        fontWeight: isActive ? 600 : 500,
                        textTransform: "capitalize",
                      }}
                      className={!isActive ? "hover:bg-gray-100" : ""}
                    >
                      <span>{cat === "all" ? "All Categories" : cat}</span>
                      {isActive && <ChevronRight size={16} style={{ color: "#fff" }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Sort by Price</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { id: "price_asc", label: "Price: Low to High" },
                  { id: "price_desc", label: "Price: High to Low" },
                  { id: "newest", label: "Newest First" }
                ].map(sort => (
                  <label key={sort.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="sort" 
                      checked={sortBy === sort.id}
                      onChange={() => setSortBy(sort.id)}
                      style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }}
                    />
                    <span style={{ fontSize: "0.938rem", color: "var(--color-text-primary)" }}>{sort.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Price Range</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", outline: "none" }}
                />
                <span style={{ color: "var(--color-text-muted)" }}>-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", outline: "none" }}
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Rating</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[4, 3, 2, 1].map(stars => (
                  <label key={stars} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={ratingFilter.includes(stars)}
                      onChange={() => toggleRating(stars)}
                      style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} fill={i < stars ? "#f59e0b" : "transparent"} color={i < stars ? "#f59e0b" : "#d1d5db"} />
                      ))}
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginLeft: 4 }}>& up</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Vendors */}
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12 }}>Vendors</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {vendors.map(vendor => (
                  <label key={vendor} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={vendorFilter.includes(vendor)}
                      onChange={() => toggleVendor(vendor)}
                      style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }}
                    />
                    <span style={{ fontSize: "0.938rem", color: "var(--color-text-primary)" }}>{vendor}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={clearFilters}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                backgroundColor: "#fff",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                cursor: "pointer",
                marginTop: 8
              }}
              className="hover:bg-gray-50"
            >
              Clear all filters
            </button>

          </div>

          {/* ================= MAIN CONTENT ================= */}
          <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 4 }}>
                  All Products
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  {filteredProducts.length} products found
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
                <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: "100%", 
                    height: 44, 
                    paddingLeft: 44, 
                    paddingRight: 16,
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--color-border)",
                    outline: "none"
                  }}
                  className="focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Promo Banner */}
            <div style={{
              backgroundColor: "#0f172a",
              borderRadius: "16px",
              padding: "24px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
              backgroundImage: "radial-gradient(circle at 10% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 40%)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "rgba(34, 197, 94, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star size={24} style={{ color: "var(--color-primary-light)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                    Get extra 10% off on selected items
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                    Use code <span style={{ color: "var(--color-primary-light)", fontWeight: 700 }}>SELECT10</span> at checkout
                  </p>
                </div>
              </div>
              <Link to="/products" style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                padding: "10px 24px",
                borderRadius: "var(--radius-full)",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none"
              }} className="hover:bg-green-600 transition-colors">
                Shop now
              </Link>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
                <Loader2 size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", 
                gap: 20 
              }}>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 20px", backgroundColor: "#fff", borderRadius: "16px", border: "1px dashed var(--color-border)" }}>
                <Search size={48} style={{ margin: "0 auto 16px", color: "var(--color-border-dark)" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>No products found</h3>
                <p style={{ color: "var(--color-text-muted)" }}>Try adjusting your filters or search term to find what you're looking for.</p>
                <button 
                  onClick={clearFilters}
                  style={{ marginTop: 24, padding: "10px 24px", borderRadius: "var(--radius-full)", backgroundColor: "var(--color-primary)", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 900px) {
          .container > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
          .desktop-sidebar {
            display: none !important; /* Hide sidebar on mobile for now, or build a toggle drawer later */
          }
        }
      `}</style>
    </div>
  );
}
