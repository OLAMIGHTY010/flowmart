import { useState } from "react";
import { Search, Package, MapPin, Phone, Truck } from "lucide-react";

const mockOrders = [
  { id: "ORD-948271", date: "Today, 10:45 AM", customer: "John Doe", phone: "+2348012345678", address: "123 Main St, Lagos", items: "2x Tomatoes, 1x Rice", total: 11400, status: "pending" },
  { id: "ORD-948272", date: "Yesterday, 02:30 PM", customer: "Jane Smith", phone: "+2348098765432", address: "45 Broad St, Lagos", items: "1x Honey", total: 3500, status: "ready" },
  { id: "ORD-948273", date: "10 Oct 2023, 09:15 AM", customer: "Mike Johnson", phone: "+2348055555555", address: "8 Allen Ave, Ikeja", items: "5x Plantain", total: 7500, status: "delivered" },
];

const statusStyles = {
  pending: { bg: "#FFFBEB", color: "var(--color-accent-amber)", label: "New Order" },
  ready: { bg: "#EFF6FF", color: "var(--color-accent-blue)", label: "Ready for Rider" },
  delivered: { bg: "var(--color-primary-surface)", color: "var(--color-primary)", label: "Delivered" },
};

const VendorOrders = () => {
  const [filter, setFilter] = useState("all");

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 32 }}>
        Orders Management
      </h1>

      <div className="card">
        {/* Header / Tabs */}
        <div style={{ borderBottom: "1px solid var(--color-border)", display: "flex", overflowX: "auto" }}>
          {["all", "pending", "ready", "delivered"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: "16px 24px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: filter === tab ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: `2px solid ${filter === tab ? "var(--color-primary)" : "transparent"}`,
                textTransform: "capitalize",
                transition: "all var(--transition-fast)",
                whiteSpace: "nowrap"
              }}
            >
              {tab === "pending" ? "New Orders" : tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mockOrders.filter(o => filter === "all" || o.status === filter).map((order) => {
              const status = statusStyles[order.status as keyof typeof statusStyles];
              
              return (
                <div key={order.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, borderBottom: "1px solid var(--color-border-light)", paddingBottom: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>#{order.id}</h3>
                        <span style={{ backgroundColor: status.bg, color: status.color, padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 600 }}>
                          {status.label}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>{order.date}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary)" }}>₦{order.total.toLocaleString()}</p>
                      <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>{order.items}</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                    <div>
                      <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5, color: "var(--color-text-muted)", marginBottom: 8 }}>Customer Details</h4>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: 4 }}>{order.customer}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.813rem", color: "var(--color-text-secondary)" }}>
                        <Phone size={14} /> {order.phone}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5, color: "var(--color-text-muted)", marginBottom: 8 }}>Delivery Address</h4>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.813rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{order.address}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                      {order.status === "pending" && (
                        <button className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.875rem" }}>
                          <Package size={16} /> Mark as Ready
                        </button>
                      )}
                      {order.status === "ready" && (
                        <button className="btn-secondary" disabled style={{ padding: "10px 20px", fontSize: "0.875rem", opacity: 0.7 }}>
                          <Truck size={16} /> Waiting for Rider
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOrders;
