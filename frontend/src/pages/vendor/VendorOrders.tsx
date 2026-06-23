import { useState } from "react";
import { Search, Package, MapPin, Phone, Truck, Radio, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

const statusStyles = {
  pending: { bg: "#FFFBEB", color: "var(--color-accent-amber)", label: "New Order" },
  ready: { bg: "#EFF6FF", color: "var(--color-accent-blue)", label: "Packed (Ready)" },
  broadcasting: { bg: "#F3E8FF", color: "#9333EA", label: "Broadcasting" },
  assigned: { bg: "#E0E7FF", color: "#4F46E5", label: "Rider Assigned" },
  picked_up: { bg: "#FEF3C7", color: "#D97706", label: "With Rider" },
  delivered: { bg: "var(--color-primary-surface)", color: "var(--color-primary)", label: "Delivered" },
};

const VendorOrders = () => {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Phase 4: Fetch real orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: () => apiClient.get<{ success: boolean; orders: any[] }>("/vendor/orders"),
  });

  const orders = ordersData?.orders || [];

  // Broadcast Mutation
  const broadcastMutation = useMutation({
    mutationFn: (orderId: string) => apiClient.post(`/delivery/${orderId}/broadcast`),
    onSuccess: () => {
      showToast("Delivery broadcasted to nearby riders!", "success");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    },
    onError: () => {
      showToast("Failed to broadcast delivery.", "error");
    }
  });

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
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : orders.length === 0 ? (
             <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
               <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
               <p>No orders found yet.</p>
             </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {orders.filter(o => filter === "all" || o.status === filter).map((order) => {
                const status = statusStyles[order.status as keyof typeof statusStyles] || { bg: "#eee", color: "#333", label: order.status };
                
                return (
                  <div key={order.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, borderBottom: "1px solid var(--color-border-light)", paddingBottom: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                          <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>#{order.orderRef || order.id.slice(0, 8)}</h3>
                          <span style={{ backgroundColor: status.bg, color: status.color, padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 600 }}>
                            {status.label}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary)" }}>₦{Number(order.total || 0).toLocaleString()}</p>
                        <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>{order.items?.length || 1} items</p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5, color: "var(--color-text-muted)", marginBottom: 8 }}>Customer Details</h4>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: 4 }}>{order.customerName || "Customer"}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.813rem", color: "var(--color-text-secondary)" }}>
                          <Phone size={14} /> {order.customerPhone || "N/A"}
                        </div>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5, color: "var(--color-text-muted)", marginBottom: 8 }}>Delivery Address</h4>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: "0.813rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                          <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{order.deliveryAddress || "N/A"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                        
                        {/* PHASE 4: Broadcast to Riders Action */}
                        {order.status === "ready" && (
                          <button 
                            className="btn-primary" 
                            style={{ padding: "10px 20px", fontSize: "0.875rem", backgroundColor: "#9333EA", border: "none" }}
                            onClick={() => broadcastMutation.mutate(order.id)}
                            disabled={broadcastMutation.isPending}
                          >
                            {broadcastMutation.isPending ? (
                              <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Broadcasting...</>
                            ) : (
                              <><Radio size={16} /> Publish to Riders</>
                            )}
                          </button>
                        )}

                        {order.status === "broadcasting" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", backgroundColor: "#F3E8FF", color: "#9333EA", borderRadius: "var(--radius-md)", fontWeight: 600 }}>
                            <Radio size={18} style={{ animation: "pulse 2s infinite" }} /> Searching for Rider...
                          </div>
                        )}

                        {["assigned", "picked_up"].includes(order.status) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)", fontWeight: 600 }}>
                            <Truck size={18} /> Rider on the way
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};

export default VendorOrders;
