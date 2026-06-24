import { Link } from "react-router-dom";
import { Package, ChevronRight, Clock, CheckCircle2, Truck, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Processing", icon: Clock, color: "var(--color-accent-amber)", bg: "#FFFBEB" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "var(--color-accent-blue)", bg: "#EFF6FF" },
  assigned: { label: "Assigned to Rider", icon: Truck, color: "var(--color-accent-purple)", bg: "#F3E8FF" },
  picked_up: { label: "Out for Delivery", icon: Truck, color: "var(--color-accent-blue)", bg: "#EFF6FF" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "var(--color-primary)", bg: "var(--color-primary-surface)" },
  cancelled: { label: "Cancelled", icon: Package, color: "var(--color-accent-red)", bg: "#FEF2F2" },
};

const Orders = () => {
  const { data: orders = [], isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="container flex justify-center items-center" style={{ minHeight: "70vh" }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 24px", minHeight: "70vh" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 32 }}>
        My Orders
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, backgroundColor: "var(--color-bg-secondary)", borderRadius: "var(--radius-xl)" }}>
            <Package size={48} style={{ color: "var(--color-text-muted)", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 8 }}>No orders yet</h3>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>You haven't placed any orders. Start exploring our products!</p>
            <Link to="/products" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          orders.map((order: any) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div key={order.id} className="card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, borderBottom: "1px solid var(--color-border)", paddingBottom: 16, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 4 }}>
                      Order #{order.orderRef || order.id.substring(0, 8).toUpperCase()}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: status.bg, padding: "6px 12px", borderRadius: "var(--radius-full)" }}>
                    <StatusIcon size={16} style={{ color: status.color }} />
                    <span style={{ fontSize: "0.813rem", fontWeight: 600, color: status.color }}>{status.label}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {order.items && order.items.map((item: any, idx: number) => (
                      <span key={idx} style={{ fontSize: "0.938rem", color: "var(--color-text-secondary)" }}>
                        {item.quantity}x {item.name || item.productName}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>Total Amount</p>
                      <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary)" }}>
                        ₦{parseFloat(order.totalAmount || "0").toLocaleString()}
                      </p>
                    </div>
                    <Link to={`/orders/${order.id}/track`} className="btn-secondary" style={{ padding: "8px 16px" }}>
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
