import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, ShieldCheck, Truck, Minus, Plus, ShoppingCart, Heart, Loader2, ArrowLeft, ShoppingBag } from "lucide-react";
import { apiClient } from "@/services/api";
import { useCartStore } from "@/stores/cartStore";
import { useToast } from "@/contexts/ToastContext";

const ProductDetails = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);
  const { showToast } = useToast();

  // Selected Option States
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, any>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiClient.get<{ success: boolean; product: any }>(`/products/${id}`),
    enabled: !!id,
  });

  const product = data?.product;

  if (isLoading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <ShoppingBag size={48} style={{ color: "var(--color-text-muted)", marginBottom: 16 }} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 8 }}>Product not found</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> Back to Shop
        </Link>
      </div>
    );
  }

  const images = product.images ? product.images.split(",").filter(Boolean) : [];
  const firstImage = images[0];

  // Food vs Retail Stock check
  const inStock = product.productType === 'food' || product.stockQuantity > 0;

  // Calculate pricing based on selections
  const basePrice = parseFloat(product.price || "0");
  const variantDiff = selectedVariant ? parseFloat(selectedVariant.price || "0") : 0;
  const modifierSum = Object.values(selectedModifiers).reduce((sum, item) => {
    if (Array.isArray(item)) {
      return sum + item.reduce((sub, opt) => sub + parseFloat(opt.price || "0"), 0);
    }
    return sum + parseFloat((item as any).price || "0");
  }, 0);
  const totalPrice = basePrice + variantDiff + modifierSum;

  const handleAddToCart = () => {
    // Generate an ID incorporating selections
    const modifierString = Object.keys(selectedModifiers).length > 0 
      ? `-${JSON.stringify(selectedModifiers)}` 
      : '';
    const variantString = selectedVariant 
      ? `-${selectedVariant.name}-${selectedVariant.value}` 
      : '';
    
    addToCart({
      id: `${product.id}${variantString}${modifierString}`,
      vendorId: product.vendorId,
      name: `${product.name}${selectedVariant ? ` (${selectedVariant.value})` : ''}`,
      price: totalPrice,
      imageUrl: firstImage || "",
      category: product.category || "",
      selectedVariant,
      selectedModifiers
    } as any, quantity);
    showToast(`${product.name} added to cart`, "success");
  };

  return (
    <div className="container" style={{ padding: "32px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 24 }}>
        <Link to="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        {product.category && (
          <>
            <Link to={`/?category=${encodeURIComponent(product.category)}`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>{product.category}</Link>
            <span style={{ margin: "0 8px" }}>/</span>
          </>
        )}
        <span style={{ color: "var(--color-text-primary)" }}>{product.name}</span>
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
            position: "relative",
            overflow: "hidden",
          }}>
            {firstImage ? (
              <img
                src={firstImage.startsWith("http") ? firstImage : `https://flowmart-bucket.s3.amazonaws.com/${firstImage}`}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <ShoppingBag size={80} style={{ color: "var(--color-text-muted)" }} />
            )}
            
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
                border: "none",
                cursor: "pointer",
                transition: "transform var(--transition-fast)",
              }}
            >
              <Heart size={22} style={{ 
                color: isLiked ? "var(--color-accent-red)" : "var(--color-text-muted)",
                fill: isLiked ? "var(--color-accent-red)" : "none"
              }} />
            </button>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div style={{ display: "flex", gap: 8 }}>
              {images.slice(0, 4).map((img: string, idx: number) => (
                <div key={idx} style={{
                  width: 64,
                  height: 64,
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: idx === 0 ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                }}>
                  <img
                    src={img.startsWith("http") ? img : `https://flowmart-bucket.s3.amazonaws.com/${img}`}
                    alt={`${product.name} ${idx + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span className={inStock ? "badge badge-green" : "badge badge-red"}>
              {inStock ? "In Stock" : "Out of Stock"}
            </span>
            {product.category && (
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                {product.category}
              </span>
            )}
            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4, backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}>
              {product.productType === 'food' ? '🍔 Food' : '🛍️ Retail'}
            </span>
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8, lineHeight: 1.2 }}>
            {product.name}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)" }}>
              ₦{totalPrice.toLocaleString()}
            </span>
            {product.oldPrice && (
              <span style={{ fontSize: "1.25rem", color: "var(--color-text-muted)", textDecoration: "line-through" }}>
                ₦{Number(product.oldPrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Prep Time or SKU/Brand */}
          {product.productType === 'food' ? (
            product.preparationTime && (
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 16 }}>
                🕒 <strong>Prep Time:</strong> {product.preparationTime} minutes
              </div>
            )
          ) : (
            (product.brand || product.sku || product.weight) && (
              <div style={{ display: "flex", gap: 16, fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 16 }}>
                {product.brand && <span><strong>Brand:</strong> {product.brand}</span>}
                {product.sku && <span><strong>SKU:</strong> {product.sku}</span>}
                {product.weight && <span><strong>Weight:</strong> {product.weight} kg</span>}
              </div>
            )
          )}

          {/* Dietary Tags */}
          {product.productType === 'food' && Array.isArray(product.dietaryTags) && product.dietaryTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {product.dietaryTags.map((tag: string) => (
                <span key={tag} style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "rgba(6, 78, 59, 0.08)",
                  color: "#064e3b",
                  padding: "4px 10px",
                  borderRadius: 100,
                  border: "1px solid rgba(6, 78, 59, 0.15)"
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.description && (
            <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              {product.description}
            </p>
          )}

          {/* Variants Selector */}
          {product.productType === 'retail' && Array.isArray(product.variants) && product.variants.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: 10, color: "var(--color-text-primary)" }}>Available Options:</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {product.variants.map((v: any, idx: number) => {
                  const isSelected = selectedVariant?.name === v.name && selectedVariant?.value === v.value;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedVariant(isSelected ? null : v)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                        backgroundColor: isSelected ? "rgba(6, 78, 59, 0.05)" : "transparent",
                        color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                        cursor: "pointer",
                        transition: "all var(--transition-fast)"
                      }}
                    >
                      {v.name}: {v.value} {parseFloat(v.price) > 0 ? `(+₦${parseFloat(v.price).toLocaleString()})` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifiers Selector */}
          {product.productType === 'food' && Array.isArray(product.modifiers) && product.modifiers.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
              {product.modifiers.map((group: any, gIdx: number) => (
                <div key={gIdx} style={{ padding: 12, borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-secondary)" }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
                    {group.name} {group.required && <span style={{ color: "var(--color-accent-red)" }}>*</span>}
                    <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 6 }}>
                      ({group.type === 'single' ? 'Select one' : 'Select multiple'})
                    </span>
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {group.options.map((opt: any, oIdx: number) => {
                      const selectedList = selectedModifiers[group.name] || [];
                      const isSelected = selectedList.some((o: any) => o.name === opt.name);
                      
                      const handleSelect = () => {
                        if (group.type === 'single') {
                          setSelectedModifiers({
                            ...selectedModifiers,
                            [group.name]: isSelected ? [] : [opt]
                          });
                        } else {
                          const newList = isSelected
                            ? selectedList.filter((o: any) => o.name !== opt.name)
                            : [...selectedList, opt];
                          setSelectedModifiers({
                            ...selectedModifiers,
                            [group.name]: newList
                          });
                        }
                      };

                      return (
                        <label key={oIdx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--color-text-primary)", cursor: "pointer" }}>
                          <input
                            type={group.type === 'single' ? "radio" : "checkbox"}
                            name={group.name}
                            checked={isSelected}
                            onChange={handleSelect}
                            style={{ accentColor: "var(--color-primary)" }}
                          />
                          <span>{opt.name}</span>
                          {parseFloat(opt.price) > 0 && (
                            <span style={{ color: "var(--color-text-muted)", marginLeft: "auto" }}>
                              +₦{parseFloat(opt.price).toLocaleString()}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 32 }} />

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
                style={{ width: 48, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-secondary)", border: "none", cursor: "pointer" }}
              >
                <Minus size={18} />
              </button>
              <div style={{ width: 60, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 600 }}>
                {quantity}
              </div>
              <button 
                onClick={() => setQuantity(Math.min(product.productType === 'food' ? 99 : (product.stockQuantity || 99), quantity + 1))}
                style={{ width: 48, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-secondary)", border: "none", cursor: "pointer" }}
              >
                <Plus size={18} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-primary"
              style={{ flex: 1, minWidth: 200, height: 52, fontSize: "1.063rem", opacity: inStock ? 1 : 0.5, cursor: inStock ? "pointer" : "not-allowed" }}
            >
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ProductDetails;
