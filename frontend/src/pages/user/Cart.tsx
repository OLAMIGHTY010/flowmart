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
      <div style={{ minHeight: "80vh", backgroundColor: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ 
          width: 100, height: 100, borderRadius: "50%", 
          backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", 
          marginBottom: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" 
        }}>
          <ShoppingBag size={48} style={{ color: "var(--color-primary)" }} />
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1f2937", marginBottom: 12 }}>Your cart is empty!</h2>
        <p style={{ color: "#6b7280", marginBottom: 32, fontSize: "1rem" }}>Browse our categories and discover our best deals!</p>
        <Link to="/" style={{
          backgroundColor: "var(--color-primary)", color: "#fff", padding: "14px 32px",
          borderRadius: "8px", fontWeight: 700, textDecoration: "none",
          boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          transition: "transform 0.2s, box-shadow 0.2s"
        }} className="hover:-translate-y-1 hover:shadow-lg">
          START SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: "32px 0 64px 0" }}>
      <div className="container" style={{ padding: "0 24px", maxWidth: 1200 }}>
        
        <div className="cart-layout" style={{ display: "grid", gap: 24, alignItems: "start" }}>
          
          {/* ================= LEFT COLUMN: CART ITEMS ================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            <div style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
              overflow: "hidden"
            }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1f2937", margin: 0 }}>
                  Cart ({cart.length})
                </h1>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {cart.map((item, index) => (
                  <div key={item.id} style={{ 
                    padding: "24px", 
                    borderBottom: index < cart.length - 1 ? "1px solid #f3f4f6" : "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16
                  }}>
                    {/* Top Row: Image & Info */}
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{
                        width: 100, height: 100, borderRadius: "8px",
                        backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", flexShrink: 0
                      }}>
                        {item.imageUrl || item.images ? (
                          <img
                            src={(item.imageUrl || item.images?.[0] || "").startsWith("http") ? (item.imageUrl || item.images?.[0]) : `https://flowmart-bucket.s3.amazonaws.com/${item.imageUrl || item.images?.[0]}`}
                            alt={item.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <ShoppingBag size={32} style={{ color: "#d1d5db" }} />
                        )}
                      </div>
                      
                      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        {item.category && (
                          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 4 }}>
                            {item.category}
                          </span>
                        )}
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937", marginBottom: 8, lineHeight: 1.4 }}>
                          {item.name}
                        </h3>
                        {/* Seller tag - Chowdeck style */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px", alignSelf: "flex-start" }}>
                          <ShieldCheck size={12} style={{ color: "var(--color-primary)" }} />
                          <span style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 500 }}>Verified Seller</span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1f2937" }}>
                          ₦{Number(item.price).toLocaleString()}
                        </div>
                        {item.oldPrice && (
                          <div style={{ fontSize: "0.875rem", color: "#9ca3af", textDecoration: "line-through", marginTop: 4 }}>
                            ₦{Number(item.oldPrice).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <button
                        onClick={() => removeFromCart(item.id as string)}
                        style={{ 
                          display: "flex", alignItems: "center", gap: 6,
                          color: "#ef4444", background: "none", border: "none", cursor: "pointer",
                          fontWeight: 600, fontSize: "0.875rem", padding: "8px 12px", borderRadius: "8px",
                          transition: "background-color 0.2s"
                        }}
                        className="hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">REMOVE</span>
                      </button>

                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {/* Quantity Controls - Chowdeck style */}
                        <div style={{ 
                          display: "flex", alignItems: "center", 
                          backgroundColor: "#f3f4f6", borderRadius: "8px",
                          padding: "4px"
                        }}>
                          <button
                            onClick={() => decreaseQty(item.id as string)}
                            style={{ 
                              width: 32, height: 32, borderRadius: "6px",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              backgroundColor: item.qty > 1 ? "var(--color-primary)" : "#d1d5db", 
                              color: "#fff", border: "none", cursor: item.qty > 1 ? "pointer" : "not-allowed",
                              transition: "background-color 0.2s"
                            }}
                          >
                            <Minus size={16} strokeWidth={3} />
                          </button>
                          <div style={{ width: 40, textAlign: "center", fontSize: "1rem", fontWeight: 700, color: "#1f2937" }}>
                            {item.qty}
                          </div>
                          <button
                            onClick={() => increaseQty(item.id as string)}
                            style={{ 
                              width: 32, height: 32, borderRadius: "6px",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              backgroundColor: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer",
                              transition: "background-color 0.2s"
                            }}
                            className="hover:bg-green-600"
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
          <div style={{ position: "sticky", top: 88 }}>
            <div style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
              overflow: "hidden"
            }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1f2937", margin: 0, textTransform: "uppercase" }}>
                  Cart Summary
                </h2>
              </div>
              
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: "1rem", color: "#4b5563" }}>Subtotal</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "#1f2937" }}>₦{subtotal.toLocaleString()}</span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "1rem", color: "#4b5563" }}>Delivery Fee</span>
                  <span style={{ fontSize: "1rem", fontWeight: 600, color: shippingFee === 0 ? "var(--color-primary)" : "#1f2937" }}>
                    {shippingFee === 0 ? "Free" : `₦${shippingFee.toLocaleString()}`}
                  </span>
                </div>
                
                <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f3f4f6" }}>
                  FlowMart Express delivery is free for all orders above ₦50,000!
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                  <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#1f2937" }}>Total</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>₦{total.toLocaleString()}</span>
                </div>

                <button 
                  onClick={() => navigate("/checkout")} 
                  style={{ 
                    width: "100%", padding: "16px", borderRadius: "8px",
                    backgroundColor: "var(--color-primary)", color: "#fff", border: "none", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)", transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                  className="hover:-translate-y-1 hover:shadow-lg"
                >
                  <span style={{ fontSize: "1rem", fontWeight: 700 }}>CHECKOUT (₦{total.toLocaleString()})</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Link to="/products" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
                Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .cart-layout { grid-template-columns: 1fr; }
        @media (min-width: 1024px) {
          .cart-layout { grid-template-columns: 2fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Cart;
