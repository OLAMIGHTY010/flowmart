import { Link } from "react-router-dom";
import { Package, Navigation, MapPin, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/contexts/ToastContext";
import { apiClient } from "@/services/api";

const mockActiveDelivery = {
  id: "DEL-9082",
  pickup: "Farm Fresh NG, 12 Broad St, Lagos",
  dropoff: "John Doe, 8 Allen Ave, Ikeja",
  distance: "4.2 km",
  earnings: 850,
  status: "picking_up", // picking_up, delivering
};

const RiderDashboard = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);

  // Fetch available broadcasts (Phase 3 - no hardcoding)
  const { data: broadcastsData, isLoading: loadingBroadcasts } = useQuery({
    queryKey: ["delivery-broadcasts"],
    queryFn: () => apiClient.get<{ success: boolean; broadcasts: any[] }>("/delivery/broadcasts"),
    enabled: isOnline, // only fetch if online
    refetchInterval: 5000, // poll every 5s until websocket is fully ready
  });

  const broadcasts = broadcastsData?.broadcasts || [];

  const claimMutation = useMutation({
    mutationFn: (orderId: string) => apiClient.post(`/delivery/${orderId}/claim`),
    onSuccess: () => {
      showToast("Delivery claimed successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["delivery-broadcasts"] });
      // In a real app, also invalidate the active delivery query
    },
    onError: () => {
      showToast("Failed to claim delivery. Another rider might have taken it.", "error");
    }
  });

  const toggleStatus = () => {
    setIsOnline(!isOnline);
    showToast(isOnline ? "You are now Offline" : "You are now Online and receiving requests", isOnline ? "warning" : "success");
  };

  return (
    <div>
      {/* Status Toggle Header */}
      <div className="card" style={{ padding: "20px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: isOnline ? "var(--color-primary-surface)" : "var(--color-bg-primary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: isOnline ? "var(--color-primary)" : "var(--color-text-muted)" }} />
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {isOnline ? "Online" : "Offline"}
            </h2>
            <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
              {isOnline ? "Searching for requests..." : "Go online to start earning"}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button 
          onClick={toggleStatus}
          style={{
            width: 52,
            height: 28,
            borderRadius: "var(--radius-full)",
            backgroundColor: isOnline ? "var(--color-primary)" : "var(--color-border)",
            position: "relative",
            transition: "all var(--transition-fast)",
          }}
        >
          <div style={{
            position: "absolute",
            top: 2,
            left: isOnline ? 26 : 2,
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all var(--transition-fast)",
          }} />
        </button>
      </div>

      {/* Daily Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)", marginBottom: 4 }}>Today's Earnings</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)" }}>₦4,250</h3>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)", marginBottom: 4 }}>Completed</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)" }}>5 trips</h3>
        </div>
      </div>

      {!isOnline && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "var(--color-bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertTriangle size={32} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 8 }}>You're currently offline</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Toggle your status to online to start receiving delivery requests near you.</p>
        </div>
      )}

      {isOnline && (
        <>
          {/* AVAILABLE DELIVERIES (BROADCASTS) */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Available Jobs</h2>
              {loadingBroadcasts && <Loader2 size={16} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />}
            </div>

            {broadcasts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", backgroundColor: "var(--color-bg-primary)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                <Zap size={24} style={{ color: "var(--color-text-muted)", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>No deliveries available right now. Keep checking!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {broadcasts.map((job) => (
                  <div key={job.id} className="card" style={{ padding: 16, borderLeft: "4px solid var(--color-primary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <span className="badge badge-green" style={{ fontSize: "0.6875rem", marginBottom: 8, display: "inline-block" }}>New Broadcast</span>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>{job.pickupName || "Vendor Shop"}</h3>
                        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{job.pickupAddress}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary)" }}>₦{job.payout || 0}</span>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{job.distance || "~ km"}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "12px", backgroundColor: "var(--color-bg-secondary)", borderRadius: "var(--radius-sm)", marginBottom: 16 }}>
                      <MapPin size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--color-text-muted)", fontWeight: 600 }}>Drop-off</p>
                        <p style={{ fontSize: "0.8125rem" }}>{job.dropoffAddress}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => claimMutation.mutate(job.id)}
                      disabled={claimMutation.isPending}
                      className="btn-primary" 
                      style={{ width: "100%", padding: "12px" }}
                    >
                      {claimMutation.isPending ? "Claiming..." : "Swipe / Tap to Claim"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "24px 0" }} />

          {/* Active Delivery Card */}
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 16 }}>Current Delivery</h2>
          
          <div className="card" style={{ padding: 20, border: "2px solid var(--color-primary)", position: "relative", overflow: "hidden", marginBottom: 24 }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 4, backgroundColor: "var(--color-primary)" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span className="badge badge-orange" style={{ fontSize: "0.75rem", padding: "4px 8px" }}>
                {mockActiveDelivery.status === "picking_up" ? "Pick Up Needed" : "Delivering"}
              </span>
              <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>₦{mockActiveDelivery.earnings}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
              {/* Vertical line connecting dots */}
              <div style={{ position: "absolute", left: 11, top: 16, bottom: 20, width: 2, backgroundColor: "var(--color-border-light)", zIndex: 0 }} />

              <div style={{ display: "flex", gap: 12, position: "relative", zIndex: 1 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "var(--color-primary-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Package size={14} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Pickup</p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{mockActiveDelivery.pickup}</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, position: "relative", zIndex: 1 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "var(--color-bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={14} style={{ color: "var(--color-text-muted)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Drop-off</p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{mockActiveDelivery.dropoff}</p>
                </div>
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "20px 0" }} />

            <Link to={`/rider/deliveries/${mockActiveDelivery.id}`} className="btn-primary" style={{ width: "100%", padding: 14 }}>
              <Navigation size={18} /> View Navigation
            </Link>
          </div>

          <Link to="/rider/deliveries" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            <span style={{ fontWeight: 600 }}>View Delivery History</span>
            <ArrowRight size={18} style={{ color: "var(--color-text-muted)" }} />
          </Link>
          
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
};

export default RiderDashboard;
