import { Wallet, TrendingUp, ArrowDownToLine, Calendar } from "lucide-react";

const RiderEarnings = () => {
  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 24 }}>
        My Earnings
      </h1>

      {/* Main Balance Card */}
      <div className="card" style={{ padding: 24, backgroundColor: "var(--color-dark)", color: "var(--color-text-inverse)", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-light)", marginBottom: 8 }}>Available Balance</p>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>₦24,500</h2>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={24} color="white" />
          </div>
        </div>

        <button className="btn-primary" style={{ width: "100%", backgroundColor: "white", color: "var(--color-dark)", border: "none" }}>
          <ArrowDownToLine size={18} /> Withdraw Funds
        </button>
      </div>

      {/* Overview Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--color-text-muted)" }}>
            <Calendar size={16} /> <span style={{ fontSize: "0.813rem" }}>This Week</span>
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>₦18,200</h3>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--color-text-muted)" }}>
            <TrendingUp size={16} /> <span style={{ fontSize: "0.813rem" }}>Total Trips</span>
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>42</h3>
        </div>
      </div>

      {/* Recent Transactions */}
      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 16 }}>Recent Transactions</h3>
      
      <div className="card" style={{ overflow: "hidden" }}>
        {[
          { id: 1, type: "Delivery", title: "Order #DEL-9081", date: "Today, 10:45 AM", amount: "+₦1,200", isPositive: true },
          { id: 2, type: "Delivery", title: "Order #DEL-9080", date: "Yesterday, 04:30 PM", amount: "+₦1,500", isPositive: true },
          { id: 3, type: "Withdrawal", title: "Bank Transfer", date: "10 Oct, 09:00 AM", amount: "-₦15,000", isPositive: false },
        ].map((tx, idx) => (
          <div key={tx.id} style={{ padding: "16px", borderBottom: idx !== 2 ? "1px solid var(--color-border)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: tx.isPositive ? "var(--color-primary-surface)" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {tx.isPositive ? <TrendingUp size={18} style={{ color: "var(--color-primary)" }} /> : <ArrowDownToLine size={18} style={{ color: "var(--color-accent-red)" }} />}
              </div>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{tx.title}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{tx.date}</p>
              </div>
            </div>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: tx.isPositive ? "var(--color-primary)" : "var(--color-text-primary)" }}>
              {tx.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiderEarnings;
