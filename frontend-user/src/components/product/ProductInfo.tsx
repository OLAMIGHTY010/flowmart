import { Star, Share2, Heart } from "lucide-react";
import VendorCard from "./VendorCard";
import type { Product } from "@/types/product";
import ProductSpecifications from "./ProductSpecifications";

interface Props {
  product: Product;
}

export default function ProductInfo({
  product,
}: Props) {
  const priceNum = Number(product.price);
  const displayOldPrice = product.oldPrice || Math.round(priceNum * 1.25);
  const discountPercent = Math.round(((displayOldPrice - priceNum) / displayOldPrice) * 100);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-500">
        <span>{product.brand || "Official Store"}</span>
        <span className="text-gray-300">•</span>
        <span className="text-gray-500">{product.category || "General"}</span>
      </div>

      <h1 className="mt-2 text-2xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                fill={i < 4 ? "currentColor" : "none"}
                className={i < 4 ? "text-amber-500" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-600">(4.0 out of 5 stars)</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-orange-500 transition cursor-pointer">
            <Share2 size={16} />
            Share
          </button>
          <span className="text-gray-300">|</span>
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition cursor-pointer">
            <Heart size={16} />
            Favorite
          </button>
        </div>
      </div>

      <div className="mt-4 border-b border-gray-100 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-gray-900">
            ₦{priceNum.toLocaleString()}
          </span>
          <span className="text-sm text-gray-400 line-through">
            ₦{displayOldPrice.toLocaleString()}
          </span>
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
            -{discountPercent}% OFF
          </span>
        </div>
        <p className="mt-1 text-xs text-green-600 font-medium">
          Saving ₦{(displayOldPrice - priceNum).toLocaleString()}!
        </p>
      </div>

      <div>
        <ProductSpecifications
          sku={product.sku}
          category={product.category}
          description={product.description}
        />
      </div>

      {product.vendor && (
        <div className="mt-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Seller Information
          </h3>
          <VendorCard vendor={product.vendor} />
        </div>
      )}
    </div>
  );
}