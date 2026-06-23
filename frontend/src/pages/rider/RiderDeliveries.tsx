import { Package, MapPin, CheckCircle2, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

const mockDeliveries = [
  { id: "DEL-9081", date: "Today, 10:15 AM", pickup: "TechZone Gadgets", dropoff: "8 Allen Ave, Ikeja", distance: "3.5 km", earnings: 1200, status: "completed" },
  { id: "DEL-9080", date: "Yesterday, 04:30 PM", pickup: "Farm Fresh NG", dropoff: "12 Main St, Lagos", distance: "5.1 km", earnings: 1500, status: "completed" },
  { id: "DEL-9079", date: "Yesterday, 01:10 PM", pickup: "Grain Master", dropoff: "Oshodi Market", distance: "2.8 km", earnings: 800, status: "completed" },
];

const RiderDeliveries = () => {
  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 24 }}>
        Delivery History
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {mockDeliveries.map((delivery) => (
          <div key={delivery.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>#{delivery.id}</span>
                <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{delivery.date}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary)" }}>₦{delivery.earnings}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>
                  <Navigation size={12} /> {delivery.distance}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 0", borderTop: "1px solid var(--color-border-light)", borderBottom: "1px solid var(--color-border-light)", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={14} style={{ color: "var(--color-primary)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{delivery.pickup}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={14} style={{ color: "var(--color-text-muted)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{delivery.dropoff}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontSize: "0.813rem", fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Completed
              </div>
              <Link to={`/rider/deliveries/${delivery.id}`} style={{ fontSize: "0.813rem", color: "var(--color-text-primary)", fontWeight: 600, textDecoration: "underline" }}>
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiderDeliveries;
