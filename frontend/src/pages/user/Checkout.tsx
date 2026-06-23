import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, CreditCard, ShieldCheck } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

const Checkout = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer" | "delivery">("card");

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Order placed successfully!", "success");
    navigate("/orders");
  };

  return (
    <div className="container" style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <Link to="/cart" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>← Back to Cart</Link>
      </div>

      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 32 }}>
        Checkout
      </h1>

      <form onSubmit={handlePlaceOrder} style={{ display: "grid", gap: 32 }} className="checkout-grid">
        
        {/* Left: Forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Section: Delivery Details */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--color-primary-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Delivery Address</h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Full Name</label>
                <input required type="text" className="input-field" placeholder="John Doe" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Phone Number</label>
                <input required type="tel" className="input-field" placeholder="+234..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Delivery Address</label>
                <textarea required className="input-field" rows={3} placeholder="123 Main Street..." />
              </div>
            </div>
          </div>

          {/* Section: Payment Method */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--color-primary-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Payment Method</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { id: "card", label: "Credit/Debit Card", desc: "Pay securely via Paystack or Flutterwave" },
                { id: "transfer", label: "Bank Transfer", desc: "Direct transfer to our bank account" },
                { id: "delivery", label: "Pay on Delivery", desc: "Pay via POS or cash when your order arrives" },
              ].map((method) => (
                <label key={method.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 16, padding: 16, 
                  border: `1.5px solid ${paymentMethod === method.id ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: paymentMethod === method.id ? "var(--color-primary-surface)" : "var(--color-bg-primary)",
                  cursor: "pointer", transition: "all var(--transition-fast)"
                }}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value={method.id} 
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    style={{ marginTop: 4, accentColor: "var(--color-primary)" }} 
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem" }}>{method.label}</div>
                    <div style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>{method.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div>
          <div className="card" style={{ padding: 24, position: "sticky", top: 88 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 20 }}>Order Summary</h2>
            
            {/* Items mini list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>2x Tomatoes (1kg)</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>₦2,400</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>1x Premium Rice 5kg</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>₦7,500</span>
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 20 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.938rem", color: "var(--color-text-secondary)" }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>₦9,900</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.938rem", color: "var(--color-text-secondary)" }}>
                <span>Delivery Fee</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>₦1,500</span>
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 20 }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <span style={{ fontSize: "1.125rem", fontWeight: 600 }}>Total to Pay</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>₦11,400</span>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", padding: "16px 24px" }}>
              <ShieldCheck size={20} />
              Place Order securely
            </button>
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 12 }}>
              Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
            </p>
          </div>
        </div>
      </form>

      <style>{`
        .checkout-grid { grid-template-columns: 1fr; }
        @media (min-width: 1024px) {
          .checkout-grid { grid-template-columns: 2fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
