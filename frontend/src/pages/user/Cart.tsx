import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";

// Mock Cart Data
const mockCartItems = [
  { id: "1", name: "Fresh Organic Tomatoes (1kg)", price: 1200, quantity: 2, image: "🍅", vendor: "Farm Fresh NG" },
  { id: "2", name: "Premium Rice 5kg", price: 7500, quantity: 1, image: "🍚", vendor: "Grain Master" },
];

const Cart = () => {
  const navigate = useNavigate();
  
  const subtotal = mockCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = 1500;
  const total = subtotal + deliveryFee;

  if (mockCartItems.length === 0) {
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
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 32 }}>
        Shopping Cart <span style={{ fontSize: "1.25rem", color: "var(--color-text-muted)", fontWeight: 500 }}>({mockCartItems.length} items)</span>
      </h1>

      <div style={{ display: "grid", gap: 32 }} className="cart-grid">
        
        {/* Cart Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {mockCartItems.map((item) => (
            <div key={item.id} className="card" style={{ display: "flex", padding: 16, gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {/* Image */}
              <div style={{ width: 100, height: 100, borderRadius: "var(--radius-md)", backgroundColor: "var(--color-bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", flexShrink: 0 }}>
                {item.image}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)", marginBottom: 4 }}>{item.vendor}</p>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>{item.name}</h3>
                <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary)" }}>₦{item.price.toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", height: 40 }}>
                  <button style={{ width: 36, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-secondary)" }}>
                    <Minus size={16} />
                  </button>
                  <div style={{ width: 44, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 600 }}>
                    {item.quantity}
                  </div>
                  <button style={{ width: 36, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-secondary)" }}>
                    <Plus size={16} />
                  </button>
                </div>

                <button style={{ color: "var(--color-accent-red)", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#FEF2F2" }}>
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
                <span>Delivery Fee</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>₦{deliveryFee.toLocaleString()}</span>
              </div>
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
