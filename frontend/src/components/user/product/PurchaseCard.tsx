import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Truck, RefreshCw, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import type { Product } from "@/types/product";

interface Props {
  product: Product;
}

export default function PurchaseCard({
  product,
}: Props) {
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();
  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const handleIncrement = () => {
    if (product.productType === 'food' || qty < product.stockQuantity) {
      setQty((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (qty > 1) {
      setQty((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, qty);
  };

  const isOutOfStock = product.productType !== 'food' && product.stockQuantity === 0;

  return (
    <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Stock status */}
      <div className="mb-4">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
          Availability
        </span>
        <span
          className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${
            isOutOfStock
              ? "text-red-500"
              : product.productType !== 'food' && product.stockQuantity < 10
              ? "text-amber-500"
              : "text-green-600"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-red-500' : (product.productType !== 'food' && product.stockQuantity < 10) ? 'bg-amber-500' : 'bg-green-500'}`} />
          {isOutOfStock
            ? "Out of Stock"
            : product.productType !== 'food' && product.stockQuantity < 10
            ? `Low Stock: Only ${product.stockQuantity} left!`
            : "In Stock"}
        </span>
      </div>

      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="mb-5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Quantity
          </span>
          <div className="flex items-center w-32 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={handleDecrement}
              disabled={qty <= 1}
              className="flex items-center justify-center w-10 h-10 hover:bg-gray-50 text-gray-600 disabled:text-gray-300 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <Minus size={16} />
            </button>
            <span className="flex-grow text-center font-bold text-gray-800 text-sm">
              {qty}
            </span>
            <button
              onClick={handleIncrement}
              disabled={product.productType !== 'food' && qty >= product.stockQuantity}
              className="flex items-center justify-center w-10 h-10 hover:bg-gray-50 text-gray-600 disabled:text-gray-300 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full rounded-lg bg-orange-500 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
        >
          {isOutOfStock ? "Out of Stock" : "Add To Cart"}
        </button>

        {!isOutOfStock && (
          <button
            onClick={() => {
              addToCart(product, qty);
              navigate("/cart");
            }}
            className="w-full rounded-lg border border-orange-500 py-3 text-sm font-bold uppercase tracking-wider text-orange-500 transition hover:bg-orange-50 cursor-pointer"
          >
            Buy Now
          </button>
        )}
      </div>

      {/* Delivery details / Jumia-style Info Block */}
      <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
        <div className="flex gap-3">
          <Truck size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase">
              FlowMart Express Delivery
            </h4>
            <p className="mt-1 text-xs text-gray-500 leading-normal">
              Free delivery on orders above ₦50,000. Delivery to your zone in camp.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <RefreshCw size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase">
              Easy Return Policy
            </h4>
            <p className="mt-1 text-xs text-gray-500 leading-normal">
              Easy return within 7 days. Customer satisfaction guaranteed.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <ShieldCheck size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase">
              Warranty & Safety
            </h4>
            <p className="mt-1 text-xs text-gray-500 leading-normal">
              100% genuine products sourced from verified camp vendors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}