import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

const Cart = () => {
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart);
  const increaseQty = useCartStore((s) => s.increaseQty);
  const decreaseQty = useCartStore((s) => s.decreaseQty);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.getCartSubtotal());
  const shippingFee = useCartStore((s) => s.getShippingFee());
  const total = useCartStore((s) => s.getCartTotal());

  if (cart.length === 0) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "var(--color-primary-surface)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <ShoppingBag size={40} style={{ color: "var(--color-primary)" }} />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Your cart is empty</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Shopping Cart <span style={{ fontSize: "1.25rem", color: "var(--color-text-muted)", fontWeight: 500 }}>({cart.length} items)</span>
        </h1>
        <button
          onClick={clearCart}
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-accent-red)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <X size={14} /> Clear Cart
        </button>
      </div>

      <div style={{ display: "grid", gap: 32 }} className="cart-grid">
        
        {/* Cart Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {cart.map((item) => (
            <div key={item.id} className="card" style={{ display: "flex", padding: 16, gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {/* Image */}
              <div style={{
                width: 100,
                height: 100,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl.startsWith("http") ? item.imageUrl : `https://flowmart-bucket.s3.amazonaws.com/${item.imageUrl}`}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                ) : (
                  <ShoppingBag size={32} style={{ color: "var(--color-text-muted)" }} />
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 200 }}>
                {item.category && (
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-primary)", marginBottom: 2, fontWeight: 600, textTransform: "uppercase" }}>
                    {item.category}
                  </p>
                )}
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>{item.name}</h3>
                <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary)" }}>₦{Number(item.price).toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", height: 40 }}>
                  <button
                    onClick={() => decreaseQty(item.id)}
                    style={{ width: 36, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-secondary)", border: "none", cursor: "pointer" }}
                  >
                    <Minus size={16} />
                  </button>
                  <div style={{ width: 44, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 600 }}>
                    {item.qty}
                  </div>
                  <button
                    onClick={() => increaseQty(item.id)}
                    style={{ width: 36, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-secondary)", border: "none", cursor: "pointer" }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Item line total */}
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", minWidth: 80, textAlign: "right" }}>
                  ₦{(Number(item.price) * item.qty).toLocaleString()}
                </span>

                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{ color: "var(--color-accent-red)", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#FEF2F2", border: "none", cursor: "pointer" }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div className="card" style={{ padding: 24, position: "sticky", top: 88 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 20 }}>Order Summary</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.938rem", color: "var(--color-text-secondary)" }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>₦{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.938rem", color: "var(--color-text-secondary)" }}>
                <span>Shipping</span>
                <span style={{ fontWeight: 600, color: shippingFee === 0 ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                  {shippingFee === 0 ? "Free" : `₦${shippingFee.toLocaleString()}`}
                </span>
              </div>
              {shippingFee > 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Free shipping on orders over ₦50,000
                </p>
              )}
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 20 }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <span style={{ fontSize: "1.125rem", fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>₦{total.toLocaleString()}</span>
            </div>

            <button onClick={() => navigate("/checkout")} className="btn-primary" style={{ width: "100%", justifyContent: "space-between", padding: "16px 24px" }}>
              <span>Checkout</span>
              <ArrowRight size={20} />
            </button>

            <Link to="/" style={{ display: "block", textAlign: "center", marginTop: 16, fontSize: "0.8125rem", color: "var(--color-text-muted)", textDecoration: "none" }}>
              Continue Shopping
            </Link>
          </div>
        </div>

      </div>

      <style>{`
        .cart-grid { grid-template-columns: 1fr; }
        @media (min-width: 1024px) {
          .cart-grid { grid-template-columns: 2fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Cart;
