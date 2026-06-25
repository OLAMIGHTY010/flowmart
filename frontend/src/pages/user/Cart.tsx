import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

const Cart = () => {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart);
  const increaseQty = useCartStore((s) => s.increaseQty);
  const decreaseQty = useCartStore((s) => s.decreaseQty);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const subtotal = useCartStore((s) => s.getCartSubtotal());
  const shippingFee = useCartStore((s) => s.getShippingFee());
  const total = useCartStore((s) => s.getCartTotal());

  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag size={48} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-800 mb-3">Your cart is empty!</h2>
        <p className="text-gray-500 mb-8 text-base">Browse our categories and discover our best deals!</p>
        <Link 
          to="/" 
          className="bg-green-600 text-white px-8 py-3.5 rounded-lg font-bold shadow-[0_4px_12px_rgba(34,197,94,0.3)] transition-all hover:-translate-y-1 hover:shadow-lg"
        >
          START SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 pb-16">
      <div className="container mx-auto px-6 max-w-6xl">
        
        <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
          
          {/* ================= LEFT COLUMN: CART ITEMS ================= */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h1 className="text-xl font-bold text-gray-800 m-0">
                  Cart ({cart.length})
                </h1>
              </div>

              <div className="flex flex-col bg-white">
                {cart.map((item, index) => (
                  <div key={item.id} className={`p-6 flex flex-col gap-4 ${index < cart.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    {/* Top Row: Image & Info */}
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                        {item.imageUrl || item.images ? (
                          <img
                            src={(item.imageUrl || item.images?.[0] || "").startsWith("http") ? (item.imageUrl || item.images?.[0]) : `https://flowmart-bucket.s3.amazonaws.com/${item.imageUrl || item.images?.[0]}`}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag size={32} className="text-gray-300" />
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        {item.category && (
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                            {item.category}
                          </span>
                        )}
                        <h3 className="text-base font-semibold text-gray-800 mb-2 leading-snug">
                          {item.name}
                        </h3>
                        {/* Seller tag */}
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded self-start">
                          <ShieldCheck size={12} className="text-green-600" />
                          <span className="text-xs text-gray-600 font-medium">Verified Seller</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl font-extrabold text-gray-800">
                          ₦{Number(item.price).toLocaleString()}
                        </div>
                        {item.oldPrice && (
                          <div className="text-sm text-gray-400 line-through mt-1">
                            ₦{Number(item.oldPrice).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={() => removeFromCart(item.id as string)}
                        className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 font-semibold text-sm px-3 py-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">REMOVE</span>
                      </button>

                      <div className="flex items-center gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => decreaseQty(item.id as string)}
                            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                              item.qty > 1 ? 'bg-green-600 text-white hover:bg-green-500 cursor-pointer' : 'bg-gray-300 text-white cursor-not-allowed'
                            }`}
                          >
                            <Minus size={16} strokeWidth={3} />
                          </button>
                          <div className="w-10 text-center text-base font-bold text-gray-800">
                            {item.qty}
                          </div>
                          <button
                            onClick={() => increaseQty(item.id as string)}
                            className="w-8 h-8 rounded-md flex items-center justify-center bg-green-600 text-white hover:bg-green-500 transition-colors cursor-pointer"
                          >
                            <Plus size={16} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: SUMMARY ================= */}
          <div className="sticky top-[88px]">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800 m-0 uppercase">
                  Cart Summary
                </h2>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between mb-4">
                  <span className="text-base text-gray-600">Subtotal</span>
                  <span className="text-base font-bold text-gray-800">₦{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-base text-gray-600">Delivery Fee</span>
                  <span className={`text-base font-semibold ${shippingFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {shippingFee === 0 ? "Free" : `₦${shippingFee.toLocaleString()}`}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mb-6 pb-6 border-b border-gray-100">
                  FlowMart Express delivery is free for all orders above ₦50,000!
                </p>

                <div className="flex justify-between items-center mb-8">
                  <span className="text-lg font-extrabold text-gray-800">Total</span>
                  <span className="text-2xl font-extrabold text-green-600">₦{total.toLocaleString()}</span>
                </div>

                <button 
                  onClick={() => navigate("/checkout")} 
                  className="w-full p-4 rounded-lg bg-green-600 hover:bg-green-500 hover:-translate-y-1 hover:shadow-lg text-white font-bold flex justify-between items-center shadow-[0_4px_12px_rgba(34,197,94,0.25)] transition-all"
                >
                  <span className="text-base">CHECKOUT (₦{total.toLocaleString()})</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link to="/products" className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Cart;
