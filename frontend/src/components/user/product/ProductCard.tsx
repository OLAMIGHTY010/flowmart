import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Plus } from "lucide-react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/stores/cartStore";
import { useToast } from "@/contexts/ToastContext";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const addToCart = useCartStore((s) => s.addToCart);
  const { showToast } = useToast();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart(product, 1);
    
    showToast(`${product.name} added to cart!`, "success");
  };
  // Try to parse images correctly
  let firstImage = null;
  if (product.imageUrl) {
    firstImage = product.imageUrl;
  } else if (Array.isArray(product.images) && product.images.length > 0) {
    firstImage = product.images[0];
  } else if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images as any);
      if (Array.isArray(parsed) && parsed.length > 0) {
        firstImage = parsed[0];
      } else {
        firstImage = (product.images as any).split(",")[0];
      }
    } catch {
      firstImage = (product.images as any).split(",")[0];
    }
  }

  // Clean up any stray quotes or brackets if it was a weird format
  if (typeof firstImage === "string") {
    firstImage = firstImage.replace(/[\[\]"]/g, "");
  }

  // Handle potential S3 URL vs Absolute URL vs Relative Path
  let imgSource = null;
  if (firstImage) {
    if (firstImage.startsWith("http")) {
      imgSource = firstImage;
    } else {
      imgSource = `https://flowmart-bucket.s3.amazonaws.com/${firstImage}`;
    }
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="card flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-decoration-none transition-transform hover:-translate-y-1 hover:shadow-md"
    >
      <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
        {imgSource ? (
          <img
            src={imgSource}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ShoppingBag size={32} className="text-gray-300" />
        )}
      </div>
      
      <div className="p-3 flex flex-col flex-grow">
        {product.category && (
          <p className="text-[11px] text-green-600 font-bold uppercase tracking-wider mb-1">
            {product.category}
          </p>
        )}
        <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2" title={product.name}>
          {product.name}
        </h3>
        
        <div className="mt-auto flex justify-between items-center relative">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="text-sm font-bold text-green-600">
              ₦{Number(product.price).toLocaleString()}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₦{Number(product.oldPrice).toLocaleString()}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleQuickAdd}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "var(--color-primary-surface)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            className="hover:bg-green-100 hover:scale-110"
            title="Quick add to cart"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Link>
  );
}
