import { Link } from "react-router-dom";
import { Package, ChevronRight, Clock, CheckCircle2, Truck } from "lucide-react";

const mockOrders = [
  {
    id: "ORD-948271",
    date: "12 Oct 2023",
    status: "delivered",
    total: 11400,
    items: [
      { name: "Fresh Organic Tomatoes (1kg)", qty: 2 },
      { name: "Premium Rice 5kg", qty: 1 }
    ]
  },
  {
    id: "ORD-948272",
    date: "10 Oct 2023",
    status: "in_transit",
    total: 4500,
    items: [
      { name: "Local Honey 500ml", qty: 1 },
      { name: "Plantain Bunch", qty: 2 }
    ]
  }
];

const statusConfig = {
  pending: { label: "Processing", icon: Clock, color: "var(--color-accent-amber)", bg: "#FFFBEB" },
  in_transit: { label: "Out for Delivery", icon: Truck, color: "var(--color-accent-blue)", bg: "#EFF6FF" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "var(--color-primary)", bg: "var(--color-primary-surface)" },
};

const Orders = () => {
  return (
    <div className="container" style={{ padding: "32px 24px", minHeight: "70vh" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 32 }}>
        My Orders
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {mockOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, backgroundColor: "var(--color-bg-secondary)", borderRadius: "var(--radius-xl)" }}>
            <Package size={48} style={{ color: "var(--color-text-muted)", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>No orders yet</h3>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>You haven't placed any orders. Start exploring our products!</p>
            <Link to="/" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          mockOrders.map((order) => {
            const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div key={order.id} className="card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, borderBottom: "1px solid var(--color-border)", paddingBottom: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 4 }}>Order #{order.id}</h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Placed on {order.date}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: status.bg, padding: "6px 12px", borderRadius: "var(--radius-full)" }}>
                    <StatusIcon size={16} style={{ color: status.color }} />
                    <span style={{ fontSize: "0.813rem", fontWeight: 600, color: status.color }}>{status.label}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {order.items.map((item, idx) => (
                      <span key={idx} style={{ fontSize: "0.938rem", color: "var(--color-text-secondary)" }}>
                        {item.qty}x {item.name}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>Total Amount</p>
                      <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary)" }}>₦{order.total.toLocaleString()}</p>
                    </div>
                    <Link to={`/orders/${order.id}`} className="btn-secondary" style={{ padding: "8px 16px" }}>
                      View Details <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Orders;
