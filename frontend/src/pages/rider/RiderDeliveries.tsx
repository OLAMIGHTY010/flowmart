import React from 'react';
import { useOrders } from "@/hooks/useRiderQueries";
import { Package, MapPin, CheckCircle2, Navigation, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const RiderDeliveries = () => {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-emerald-700 h-8 w-8 mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading delivery history...</p>
      </div>
    );
  }

  // Filter out cancelled orders, sorting by most recent
  const deliveries = (orders || [])
    .filter(o => o.status !== 'cancelled')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="px-1 py-4">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 24 }}>
        Delivery History
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {deliveries.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 font-medium bg-white rounded-2xl border border-slate-100 shadow-xs">
            No deliveries found in your history.
          </div>
        ) : (
          deliveries.map((delivery) => {
            const formattedDate = delivery.createdAt 
              ? format(new Date(delivery.createdAt), 'dd MMM yyyy, hh:mm a')
              : 'Unknown date';

            return (
              <div key={delivery.id} className="card" style={{ padding: 16, borderRadius: '1.25rem' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                      #{delivery.id.substring(0, 8).toUpperCase()}
                    </span>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, marginTop: 2 }}>{formattedDate}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-primary)" }}>
                      ₦{parseFloat(delivery.totalAmount).toLocaleString()}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", color: "var(--color-text-secondary)", fontSize: "0.75rem", marginTop: 2 }}>
                      <Navigation size={12} /> {delivery.distance || '~ km'}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 0", borderTop: "1px solid var(--color-border-light)", borderBottom: "1px solid var(--color-border-light)", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Package size={14} style={{ color: "var(--color-primary)" }} />
                    <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      Zone {delivery.deliveryZone}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MapPin size={14} style={{ color: "var(--color-text-muted)" }} />
                    <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                      {delivery.customerName || `Customer #${delivery.attendeeId.substring(0, 5)}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6, 
                    color: delivery.status === 'delivered' ? 'var(--color-primary)' : 'var(--color-warning)', 
                    fontSize: "0.813rem", 
                    fontWeight: 700 
                  }}>
                    <CheckCircle2 size={16} /> 
                    <span className="uppercase tracking-wider text-[10px]">
                      {delivery.status}
                    </span>
                  </div>
                  <Link to={`/rider/deliveries/${delivery.id}`} style={{ fontSize: "0.813rem", color: "var(--color-text-primary)", fontWeight: 700, textDecoration: "underline" }}>
                    View Details
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RiderDeliveries;
