import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Users,
  Check,
  PlusCircle,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { GroupOrderModal } from "@/components/cart/GroupOrderModal";
import type { Product } from "@/types/product";

const UPSELL_REFRESHMENTS: {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}[] = [
  {
    id: "upsell-coke-500",
    name: "Chilled Coca-Cola (500ml)",
    price: 650,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300",
  },
  {
    id: "upsell-water-750",
    name: "Eva Bottled Spring Water (750ml)",
    price: 400,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300",
  },
  {
    id: "upsell-zobo-cold",
    name: "Chilled Zobo Berry Cooler (500ml)",
    price: 850,
    category: "Specialty Drinks",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300",
  },
  {
    id: "upsell-cupcake-vanilla",
    name: "Glazed Vanilla Pastry & Cake",
    price: 950,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300",
  },
  {
    id: "upsell-yam-fries",
    name: "Crispy Yam Fries & Pepper Dip",
    price: 1300,
    category: "Sides",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=300",
  },
];

const Cart = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupCodeParam = searchParams.get("group") || undefined;

  const cart = useCartStore((s) => s.cart);
  const addToCart = useCartStore((s) => s.addToCart);
  const increaseQty = useCartStore((s) => s.increaseQty);
  const decreaseQty = useCartStore((s) => s.decreaseQty);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const subtotal = useCartStore((s) => s.getCartSubtotal());
  const total = useCartStore((s) => s.getCartTotal());

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(Boolean(groupCodeParam));
  const [addedUpsellId, setAddedUpsellId] = useState<string | null>(null);

  useEffect(() => {
    if (groupCodeParam) {
      setIsGroupModalOpen(true);
    }
  }, [groupCodeParam]);

  const handleAddUpsell = (item: (typeof UPSELL_REFRESHMENTS)[0]) => {
    const mockProduct: Product = {
      id: item.id,
      name: item.name,
      price: item.price,
      images: [item.image],
      category: item.category,
      description: item.name,
      rating: 4.8,
      stock: 50,
      vendorId: "flowmart-express",
    } as any;

    addToCart(mockProduct, 1);
    setAddedUpsellId(item.id);
    setTimeout(() => {
      setAddedUpsellId(null);
    }, 1500);
  };

  if (cart.length === 0) {
    return (
      <div
        className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-gray-50/50"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            backgroundColor: "var(--color-primary-surface, #e0e7ff)",
            color: "var(--color-primary, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.15)",
          }}
        >
          <ShoppingBag size={42} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-8 text-sm sm:text-base max-w-md text-center leading-relaxed">
          Discover fresh meals, local market ingredients, and daily essentials from verified FlowMart merchants.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/products"
            style={{
              backgroundColor: "var(--color-primary, #4f46e5)",
              color: "#ffffff",
            }}
            className="px-8 py-3.5 rounded-xl font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-600/25 transition hover:opacity-95 text-center"
          >
            Start Exploring Deals
          </Link>
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users size={18} className="text-indigo-600" />
            <span>Order with Friends</span>
          </button>
        </div>

        <GroupOrderModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          activeSessionCode={groupCodeParam}
        />
      </div>
    );
  }

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8 sm:py-10"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
    >
      <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-8 items-start">
        {/* ================= LEFT COLUMN: CART ITEMS ================= */}
        <div className="flex flex-col gap-5 w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
            {/* Header with Group Order Pill */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3 bg-white">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-gray-900 m-0">
                  Your Basket
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Chowdeck-Style "Order with Friends" Button */}
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition shadow-sm cursor-pointer"
              >
                <Users size={14} className="text-indigo-600" />
                <span>Order with Friends</span>
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col bg-white divide-y divide-gray-100">
              {cart.map((item) => {
                const itemId = item.cartItemId || item.id || "";
                const unitPrice =
                  item.unitPriceWithModifiers != null
                    ? item.unitPriceWithModifiers
                    : Number(item.price || 0);

                return (
                  <div key={itemId} className="p-5 sm:p-6 flex flex-col gap-4">
                    {/* Top Row: Image & Info */}
                    <div className="flex gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {item.imageUrl || item.images ? (
                          <img
                            src={
                              (item.imageUrl || item.images?.[0] || "").startsWith("http")
                                ? item.imageUrl || item.images?.[0]
                                : `https://flowmart-bucket.s3.amazonaws.com/${item.imageUrl || item.images?.[0]}`
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col">
                        {item.category && (
                          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-extrabold mb-0.5">
                            {item.category}
                          </span>
                        )}
                        <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                          {item.name}
                        </h3>

                        {/* Modifiers Chips (Chowdeck Style) */}
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.selectedModifiers.map((mod, i) => (
                              <span
                                key={i}
                                className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {mod.optionName} {mod.price > 0 && `(+₦${mod.price.toLocaleString()})`}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Special Instructions Note */}
                        {item.specialInstructions && (
                          <p className="text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-200 mt-2 italic max-w-md">
                            Note: "{item.specialInstructions}"
                          </p>
                        )}

                        {/* Verified Seller Tag */}
                        <div className="inline-flex items-center gap-1 mt-2">
                          <ShieldCheck size={13} className="text-indigo-600" />
                          <span className="text-xs text-gray-500 font-semibold">
                            FlowMart Verified Merchant
                          </span>
                        </div>
                      </div>

                      {/* Item Total Price */}
                      <div className="text-right shrink-0">
                        <div className="text-lg sm:text-xl font-black text-gray-900">
                          ₦{(unitPrice * item.qty).toLocaleString()}
                        </div>
                        {item.qty > 1 && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            ₦{unitPrice.toLocaleString()} each
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => removeFromCart(itemId)}
                        className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                        <span>REMOVE</span>
                      </button>

                      {/* Quantity Controls */}
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
                        <button
                          onClick={() => decreaseQty(itemId)}
                          disabled={item.qty <= 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition cursor-pointer"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="w-9 text-center text-sm font-black text-gray-900">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => increaseQty(itemId)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= CHOWDECK-STYLE SMART IN-CART DRINKS & SIDES UPSELL TRAY ================= */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥤</span>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    Pair with Drinks & Refreshments
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      Chowdeck Pick
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    1-tap chilled additions frequently paired with your meal
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {UPSELL_REFRESHMENTS.map((item) => {
                const isJustAdded = addedUpsellId === item.id;
                return (
                  <div
                    key={item.id}
                    className="min-w-[175px] max-w-[175px] bg-gray-50/70 hover:bg-gray-50 border border-gray-200/80 rounded-2xl p-3 flex flex-col justify-between shrink-0 transition shadow-xs"
                  >
                    <div>
                      <div className="w-full h-24 rounded-xl overflow-hidden mb-2 bg-gray-100 border border-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-0.5">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
                        {item.name}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200/60">
                      <span className="text-xs font-black text-gray-900">
                        ₦{item.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleAddUpsell(item)}
                        className={`p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          isJustAdded
                            ? "bg-emerald-500 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        }`}
                        title="Add to basket"
                      >
                        {isJustAdded ? <Check size={14} /> : <PlusCircle size={14} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: SUMMARY ================= */}
        <div className="sticky top-24 w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6">
            <h2 className="text-base font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Order Breakdown
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items Subtotal</span>
                <span className="font-extrabold text-gray-900">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimated Delivery</span>
                <span className="font-bold text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded-md">
                  Calculated at Checkout
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Escrow Guarantee</span>
                <span className="font-bold text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                  100% Protected
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mb-6 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-gray-400 block uppercase">
                  Estimated Total
                </span>
                <span className="text-2xl font-black text-gray-900">
                  ₦{total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => navigate("/checkout")}
              style={{
                backgroundColor: "var(--color-primary, #4f46e5)",
                color: "#ffffff",
              }}
              className="w-full py-4 px-6 rounded-xl font-extrabold flex items-center justify-between shadow-lg shadow-indigo-600/25 transition hover:opacity-95 cursor-pointer"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight size={18} />
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/products"
                style={{ color: "var(--color-primary, #4f46e5)" }}
                className="text-xs font-extrabold hover:underline"
              >
                ← Add More Items from Stores
              </Link>
            </div>
          </div>
        </div>
      </div>

      <GroupOrderModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        activeSessionCode={groupCodeParam}
      />
    </div>
  );
};

export default Cart;
