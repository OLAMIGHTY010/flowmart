import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Plus, Flame, Clock, Crown, Star } from "lucide-react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/stores/cartStore";
import { useToast } from "@/contexts/ToastContext";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const addToCart = useCartStore((s) => s.addToCart);
  const { showToast } = useToast();

  const isFlowPass = typeof window !== "undefined" && localStorage.getItem("flowmart_flowpass_active") === "true";

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

  if (typeof firstImage === "string") {
    firstImage = firstImage.replace(/[\[\]"]/g, "");
  }

  let imgSource = null;
  if (firstImage) {
    if (firstImage.startsWith("http")) {
      imgSource = firstImage;
    } else {
      imgSource = `https://flowmart-bucket.s3.amazonaws.com/${firstImage}`;
    }
  }

  // Simulated social proof & distance metrics
  const orderCount = Math.floor((product.name.charCodeAt(0) * 7) % 60) + 15;
  const etaMinutes = 20 + (product.name.charCodeAt(1) % 15);

  return (
    <Link
      to={`/products/${product.id}`}
      className="card flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-decoration-none transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="relative h-44 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
        {imgSource ? (
          <img
            src={imgSource}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ShoppingBag size={32} className="text-slate-300" />
        )}

        {/* Chowdeck Social Proof Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-[11px] font-bold text-white shadow-md">
          <Flame size={12} className="text-amber-400 fill-amber-400" />
          <span>{orderCount}+ ordered</span>
        </div>

        {/* Rating chip */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-[11px] font-extrabold text-slate-800 shadow-sm border border-slate-200/60">
          <Star size={11} className="text-amber-500 fill-amber-500" />
          <span>4.9</span>
        </div>
      </div>
      
      <div className="p-3.5 flex flex-col flex-grow">
        {product.category && (
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">
            {product.category}
          </p>
        )}

        <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2 leading-snug" title={product.name}>
          {product.name}
        </h3>

        {/* Chowdeck Feed Logistics Pill: Dynamic ETA & Delivery Fee */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-3">
          <Clock size={12} className="text-slate-400 shrink-0" />
          <span>{etaMinutes}-{etaMinutes + 10} mins</span>
          <span>•</span>
          {isFlowPass ? (
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <Crown size={11} className="text-amber-500" />
              Free Delivery
            </span>
          ) : (
            <span>₦850 Delivery</span>
          )}
        </div>
        
        <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between items-center relative">
          <div className="flex flex-col">
            <span className="text-base font-black text-indigo-600">
              ₦{Number(product.price).toLocaleString()}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₦{Number(product.oldPrice).toLocaleString()}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleQuickAdd}
            className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 cursor-pointer transition-all duration-200 hover:bg-indigo-600 hover:text-white hover:scale-105 shadow-sm"
            title="Quick add to cart"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Link>
  );
}
