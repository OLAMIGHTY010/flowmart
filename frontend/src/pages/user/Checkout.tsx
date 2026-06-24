import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, CreditCard, ShieldCheck, Navigation } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useToast } from "@/contexts/ToastContext";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icon in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ position, setPosition, setAddress }: any) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setAddress("Fetching location details...");
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch (err) {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    }
  });

  return position ? <Marker position={position as [number, number]} /> : null;
};

const Checkout = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_transfer" | "pay_on_delivery">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(1500);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      return;
    }
    setIsLoadingLocation(true);
    setAddress("Fetching your current location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapPosition([lat, lng]);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch (err) {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }

        setIsLoadingLocation(false);
        showToast("Location captured successfully", "success");
      },
      () => {
        setIsLoadingLocation(false);
        showToast("Unable to retrieve your location", "error");
        setAddress("");
      },
      { enableHighAccuracy: true }
    );
  };

  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
  const totalAmount = subtotal + deliveryFee;

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      setIsCalculatingDelivery(true);
      try {
        const res = await apiClient.post<{ success: boolean; deliveryCalc?: any }>("/orders/calculate-delivery", { zone: address || "default", distanceKm: 5 });
        if (res.deliveryCalc && res.deliveryCalc.finalDeliveryFee !== undefined) {
          setDeliveryFee(res.deliveryCalc.finalDeliveryFee);
        }
      } catch (err) {
        console.error("Failed to calculate delivery fee", err);
      } finally {
        setIsCalculatingDelivery(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchDeliveryFee();
    }, 1000); // 1s debounce

    return () => clearTimeout(debounceTimer);
  }, [address]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      return showToast("Your cart is empty", "error");
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map(item => ({ 
          productId: (item as any).originalProductId || item.id.substring(0, 36), 
          quantity: item.qty 
        })),
        payment_method: paymentMethod === "card" ? "paystack" : paymentMethod,
        zone: address, // address or location is sent as the zone
        phone: phone,
      };
      
      const res = await apiClient.post<{ success: boolean; paymentUrl?: string }>("/orders", payload);
      
      if (res.paymentUrl) {
        // Redirect to Paystack
        window.location.href = res.paymentUrl;
      } else {
        showToast("Order placed successfully!", "success");
        clearCart();
        navigate("/orders");
      }
    } catch (err) {
      showToast("Error placing order. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--color-primary-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MapPin size={16} style={{ color: "var(--color-primary)" }} />
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Delivery Address</h2>
              </div>
              <button 
                type="button" 
                onClick={handleGetLocation} 
                disabled={isLoadingLocation}
                className="btn-secondary" 
                style={{ fontSize: "0.75rem", padding: "8px 12px", height: "auto", display: "flex", gap: 6, alignItems: "center", borderRadius: "var(--radius-md)" }}
              >
                {isLoadingLocation ? <span className="animate-spin text-primary">⌛</span> : <Navigation size={14} />}
                Use Current Location
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Full Name</label>
                <input required type="text" className="input-field" value={fullName} readOnly style={{ backgroundColor: "var(--color-bg-secondary)", opacity: 0.8 }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Phone Number</label>
                <input required type="tel" className="input-field" placeholder="+234..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: 8 }}>Delivery Address</label>
                <textarea required className="input-field" rows={3} placeholder="123 Main Street..." value={address} onChange={(e) => setAddress(e.target.value)} />
                <div style={{ marginTop: 16, height: 250, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  <MapContainer 
                    center={mapPosition || [9.0820, 8.6753]} 
                    zoom={mapPosition ? 15 : 6} 
                    style={{ width: "100%", height: "100%", zIndex: 0 }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker position={mapPosition} setPosition={setMapPosition} setAddress={setAddress} />
                  </MapContainer>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 8 }}>
                  Click on the map to pin your exact location, or type it manually.
                </p>
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
                { id: "card", label: "Credit/Debit Card", desc: "Pay securely via Paystack" },
                { id: "bank_transfer", label: "Bank Transfer", desc: "Direct transfer to our bank account" },
                { id: "pay_on_delivery", label: "Pay on Delivery", desc: "Pay via POS or cash when your order arrives" },
              ].map((method) => (
                <div key={method.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{
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
                  {/* Card Gateway Dropdown removed - Paystack is default */}
                </div>
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
              {cart.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{item.qty}x {item.name}</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>₦{(Number(item.price) * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 20 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.938rem", color: "var(--color-text-secondary)" }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>₦{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.938rem", color: "var(--color-text-secondary)" }}>
                <span>Delivery Fee {isCalculatingDelivery && <span className="text-primary text-xs ml-2">(calculating...)</span>}</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>₦{deliveryFee.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 20 }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <span style={{ fontSize: "1.125rem", fontWeight: 600 }}>Total to Pay</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>₦{totalAmount.toLocaleString()}</span>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: "100%", padding: "16px 24px", opacity: isSubmitting ? 0.7 : 1 }}>
              <ShieldCheck size={20} />
              {isSubmitting ? "Processing..." : "Place Order securely"}
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
