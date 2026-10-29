import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Truck, RefreshCw, ShieldCheck, Sparkles, Check, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import type { Product } from "@/types/product";
import ItemCustomizerDrawer from "./ItemCustomizerDrawer";

interface Props {
  product: Product;
}

export default function PurchaseCard({
  product,
}: Props) {
  const [qty, setQty] = useState(1);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const addToCartCustomized = useCartStore((state) => state.addToCartCustomized);

  const isFood = product.productType === "food" || !product.productType;
  const isOutOfStock = product.productType !== "food" && product.stockQuantity === 0;

  const handleIncrement = () => {
    if (isFood || qty < product.stockQuantity) {
      setQty((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (qty > 1) {
      setQty((prev) => prev - 1);
    }
  };

  const handleQuickAdd = () => {
    if (isFood) {
      setIsCustomizerOpen(true);
      return;
    }
    addToCart(product, qty);
    triggerAddedFeedback();
  };

  const triggerAddedFeedback = () => {
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  return (
    <>
      <div
        className="sticky top-24 rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
      >
        {/* Availability Status */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
            Availability
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full ${
              isOutOfStock
                ? "bg-red-50 text-red-600 border border-red-200"
                : product.productType !== "food" && product.stockQuantity < 10
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isOutOfStock
                  ? "bg-red-500"
                  : product.productType !== "food" && product.stockQuantity < 10
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            {isOutOfStock
              ? "Out of Stock"
              : product.productType !== "food" && product.stockQuantity < 10
              ? `Only ${product.stockQuantity} left!`
              : "In Stock • Fast Delivery"}
          </span>
        </div>

        {/* Quantity Selector */}
        {!isOutOfStock && (
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Quantity
            </span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <button
                onClick={handleDecrement}
                disabled={qty <= 1}
                className="flex items-center justify-center w-9 h-9 hover:bg-white text-gray-600 disabled:text-gray-300 transition cursor-pointer"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center font-black text-gray-900 text-sm">
                {qty}
              </span>
              <button
                onClick={handleIncrement}
                disabled={!isFood && qty >= product.stockQuantity}
                className="flex items-center justify-center w-9 h-9 hover:bg-white text-gray-600 disabled:text-gray-300 transition cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons in FlowMart Indigo Branding */}
        <div className="space-y-3">
          {/* Chowdeck-Style Customize Button */}
          {isFood && !isOutOfStock && (
            <button
              onClick={() => setIsCustomizerOpen(true)}
              style={{
                backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                color: "var(--color-primary, #4f46e5)",
              }}
              className="w-full rounded-xl py-3 text-xs sm:text-sm font-extrabold tracking-wide border border-indigo-200 flex items-center justify-center gap-2 transition hover:bg-indigo-100 cursor-pointer shadow-sm"
            >
              <Sparkles size={16} />
              <span>Customize Meal Options & Sides</span>
            </button>
          )}

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            style={{
              backgroundColor: isOutOfStock
                ? "#e5e7eb"
                : addedAnimation
                ? "#10b981"
                : "var(--color-primary, #4f46e5)",
            }}
            className="w-full rounded-xl py-3.5 text-sm font-extrabold text-white shadow-md shadow-indigo-600/20 transition-all hover:opacity-95 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {addedAnimation ? (
              <>
                <Check size={18} strokeWidth={3} />
                <span>Added to Cart!</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag size={18} />
                <span>{isFood ? "Customize & Add" : "Add to Cart"}</span>
              </>
            )}
          </button>

          {!isOutOfStock && (
            <button
              onClick={() => {
                addToCart(product, qty);
                navigate("/checkout");
              }}
              style={{
                color: "var(--color-primary, #4f46e5)",
                borderColor: "var(--color-primary, #4f46e5)",
              }}
              className="w-full rounded-xl border-2 py-3 text-xs sm:text-sm font-extrabold transition hover:bg-indigo-50 cursor-pointer"
            >
              Express Checkout
            </button>
          )}
        </div>

        {/* Value Guarantees */}
        <div className="mt-6 border-t border-gray-100 pt-5 space-y-3.5">
          <div className="flex gap-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                color: "var(--color-primary, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Truck size={16} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-gray-900">
                FlowMart Express Dispatch
              </h4>
              <p className="mt-0.5 text-xs text-gray-500 leading-normal">
                Estimated delivery in ~25-35 minutes with live GPS courier tracking.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                color: "var(--color-primary, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-gray-900">
                FlowMart Escrow Protection
              </h4>
              <p className="mt-0.5 text-xs text-gray-500 leading-normal">
                100% money-back escrow until you confirm PIN delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chowdeck-Style Customizer Bottom Sheet Drawer */}
      <ItemCustomizerDrawer
        product={product}
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onAddToCart={(customizedItem) => {
          addToCartCustomized({
            product: customizedItem.product,
            quantity: customizedItem.quantity,
            selectedModifiers: customizedItem.selectedModifiers,
            specialInstructions: customizedItem.specialInstructions,
            unitPriceWithModifiers: customizedItem.unitPriceWithModifiers,
          });
          triggerAddedFeedback();
        }}
      />
    </>
  );
}
