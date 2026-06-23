import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, ShieldCheck, Truck, Minus, Plus, ShoppingCart, Heart } from "lucide-react";

// Mock data for initial UI
const mockProduct = {
  id: "1",
  name: "Fresh Organic Tomatoes (1kg)",
  price: 1200,
  oldPrice: 1500,
  rating: 4.8,
  reviews: 124,
  description: "Farm-fresh organic tomatoes sourced directly from local farmers. Perfect for salads, stews, and sauces. Handpicked daily to ensure the highest quality and freshness.",
  vendor: { name: "Farm Fresh NG", rating: 4.9, verified: true },
  images: ["🍅"], // Placeholder for real image URLs
  stock: 50,
  category: "Groceries",
};

const ProductDetails = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  // In a real app, you would fetch the product using React Query here based on the `id`

  return (
    <div className="container" style={{ padding: "32px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 24 }}>
        <Link to="/" style={{ color: "var(--color-primary)" }}>Home</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <Link to={`/category/${mockProduct.category}`} style={{ color: "var(--color-primary)" }}>{mockProduct.category}</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--color-text-primary)" }}>{mockProduct.name}</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 40,
      }} className="product-grid">
        
        {/* Left: Images */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            width: "100%",
            aspectRatio: "1/1",
            backgroundColor: "var(--color-bg-tertiary)",
            borderRadius: "var(--radius-xl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8rem",
            position: "relative",
          }}>
            {mockProduct.images[0]}
            
            {/* Wishlist Button */}
            <button 
              onClick={() => setIsLiked(!isLiked)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "var(--color-bg-primary)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform var(--transition-fast)",
              }}
            >
              <Heart size={22} style={{ 
                color: isLiked ? "var(--color-accent-red)" : "var(--color-text-muted)",
                fill: isLiked ? "var(--color-accent-red)" : "none"
              }} />
            </button>
          </div>
        </div>

        {/* Right: Details */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span className="badge badge-green">In Stock</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={16} style={{ color: "var(--color-accent-amber)", fill: "var(--color-accent-amber)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{mockProduct.rating}</span>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>({mockProduct.reviews} reviews)</span>
            </div>
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8, lineHeight: 1.2 }}>
            {mockProduct.name}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)" }}>
              ₦{mockProduct.price.toLocaleString()}
            </span>
            <span style={{ fontSize: "1.25rem", color: "var(--color-text-muted)", textDecoration: "line-through" }}>
              ₦{mockProduct.oldPrice.toLocaleString()}
            </span>
          </div>

          <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 32 }}>
            {mockProduct.description}
          </p>

          <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 32 }} />

          {/* Vendor Info */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 16, 
            padding: "16px", 
            backgroundColor: "var(--color-bg-secondary)", 
            borderRadius: "var(--radius-lg)",
            marginBottom: 32
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-primary-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-primary)"
            }}>
              {mockProduct.vendor.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{mockProduct.vendor.name}</h3>
                {mockProduct.vendor.verified && <ShieldCheck size={16} style={{ color: "var(--color-primary-light)" }} />}
              </div>
              <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
                Vendor Rating: {mockProduct.vendor.rating} / 5.0
              </p>
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              border: "1.5px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              height: 52,
            }}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: 48, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-secondary)" }}
              >
                <Minus size={18} />
              </button>
              <div style={{ width: 60, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 600 }}>
                {quantity}
              </div>
              <button 
                onClick={() => setQuantity(Math.min(mockProduct.stock, quantity + 1))}
                style={{ width: 48, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-secondary)" }}
              >
                <Plus size={18} />
              </button>
            </div>

            <button className="btn-primary" style={{ flex: 1, minWidth: 200, height: 52, fontSize: "1.063rem" }}>
              <ShoppingCart size={20} />
              Add to Cart
            </button>
          </div>

          {/* Trust Badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-secondary)" }}>
              <Truck size={20} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontSize: "0.875rem" }}>Delivery usually within 24-48 hours</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-secondary)" }}>
              <ShieldCheck size={20} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontSize: "0.875rem" }}>Secure payment and money-back guarantee</span>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .product-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;
