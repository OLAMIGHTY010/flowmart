import React from 'react';
import { useDashboardStats, useOrders } from "@/hooks/useRiderQueries";
import { Wallet, TrendingUp, ArrowDownToLine, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/contexts/ToastContext";

const RiderEarnings = () => {
  const { showToast } = useToast();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  const handleWithdraw = () => {
    showToast("Withdrawal feature coming soon!", "info");
  };

  const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
  
  // Format dates/amounts dynamically
  const balance = stats?.totalRevenue || '₦0.00';
  const totalTrips = stats?.deliveriesCount ?? deliveredOrders.length;
  const thisWeekEarnings = stats?.revenueToday || '₦0.00';

  // Combine payouts and delivered orders to build recent transactions list dynamically
  const transactions = [
    ...(stats?.payouts || []).map((p, idx) => ({
      id: `payout-${idx}`,
      title: p.type === 'withdrawal' ? 'Bank Transfer' : 'Delivery Bonus',
      date: p.date ? format(new Date(p.date), 'dd MMM, hh:mm a') : 'Recent',
      amount: `${p.type === 'withdrawal' ? '-' : '+'}${p.amount}`,
      isPositive: p.type !== 'withdrawal',
    })),
    ...deliveredOrders.map(o => ({
      id: `order-${o.id}`,
      title: `Order #${o.id.substring(0, 8).toUpperCase()}`,
      date: o.createdAt ? format(new Date(o.createdAt), 'dd MMM, hh:mm a') : 'Recent',
      amount: `+₦${parseFloat(o.totalAmount).toLocaleString()}`,
      isPositive: true,
    }))
  ].slice(0, 10); // Limit to top 10 recent transactions

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-emerald-700 h-8 w-8 mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading your earnings data...</p>
      </div>
    );
  }

  return (
    <div className="px-1 py-4">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 24 }}>
        My Earnings
      </h1>

      {/* Main Balance Card */}
      <div className="card" style={{ padding: 24, backgroundColor: "var(--color-dark)", color: "var(--color-text-inverse)", marginBottom: 24, borderRadius: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-light)", marginBottom: 8 }}>Available Balance</p>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{balance}</h2>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={24} color="white" />
          </div>
        </div>

        <button 
          onClick={handleWithdraw}
          className="btn-primary cursor-pointer hover:opacity-90 transition" 
          style={{ width: "100%", backgroundColor: "white", color: "var(--color-dark)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: "1rem", fontWeight: 700 }}
        >
          <ArrowDownToLine size={18} /> Withdraw Funds
        </button>
      </div>

      {/* Overview Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 16, borderRadius: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--color-text-muted)" }}>
            <Calendar size={16} /> <span style={{ fontSize: "0.813rem", fontWeight: 600 }}>Today's Revenue</span>
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{thisWeekEarnings}</h3>
        </div>
        <div className="card" style={{ padding: 16, borderRadius: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--color-text-muted)" }}>
            <TrendingUp size={16} /> <span style={{ fontSize: "0.813rem", fontWeight: 600 }}>Total Completed</span>
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{totalTrips} jobs</h3>
        </div>
      </div>

      {/* Recent Transactions */}
      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 16 }}>Recent Transactions</h3>
      
      <div className="card" style={{ overflow: "hidden", borderRadius: "1.5rem" }}>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 font-medium">
            No transactions found yet.
          </div>
        ) : (
          transactions.map((tx, idx) => (
            <div 
              key={tx.id} 
              style={{ 
                padding: "16px", 
                borderBottom: idx !== transactions.length - 1 ? "1px solid var(--color-border)" : "none", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: "50%", 
                  backgroundColor: tx.isPositive ? "var(--color-primary-surface)" : "#FEF2F2", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  {tx.isPositive ? (
                    <TrendingUp size={18} style={{ color: "var(--color-primary)" }} />
                  ) : (
                    <ArrowDownToLine size={18} style={{ color: "var(--color-accent-red)" }} />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{tx.title}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{tx.date}</p>
                </div>
              </div>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: tx.isPositive ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                {tx.amount}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RiderEarnings;
